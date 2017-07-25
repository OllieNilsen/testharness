const AWS = require('@spokedev/np_aws_utils');
const lambda = new AWS.Lambda({ region: "eu-west-1" });
const request = require('request-promise');
const R = require('ramda');
const u = require('./utils');
const Promise = require('bluebird');
const data = require('./data.js');
const config = require('../config/infrastructure.json');
const storage = require('./storage');
const state = require('./state');
const uuidV4 = require('uuid/v4');

class Consumer {
  constructor(consumerType) {
    this.ct = consumerType;
    this.ctPl = `${consumerType}s`;
    this.ctKey = `${consumerType}Id`;
    this.current = storage.state[this.ctPl] ? R.values(storage.state[this.ctPl])[0] : undefined;
  }

  handleParseError(result) {
    const error = coreUtils.error(500, result);
    console.log('Authenticator response is not valid JSON', { error }, 'error');
    throw error;
  }

  rotateCurrent() {
    if (!this.current || !storage.state[this.ctPl]) return console.log(`There are no ${this.ctPl} to rotate!`)
    const keys = R.keys(storage.state[this.ctPl]);
    const i = (keys.indexOf(this.current.consumerId) + 1) % keys.length;
    this.current = storage.state[this.ctPl][keys[i]]
  }

  create() {
    const consumerId = uuidV4();
    const consumer = data[this.ct].call(undefined, consumerId);
    return request({
      uri: `${config.spokeHub}/${this.ctPl}`,
      method: 'POST',
      json: true,
      headers: { 'x-spoke-admin': 'abc123' },
      body: consumer
    })
      .then(R.set(R.lensProp('consumerId'), consumerId))
      .then(data => Promise.all([
        storage.putItem(`${this.ctPl}/${consumerId}`, data),
        Promise.resolve(this.current = data),
        Promise.resolve(data)
      ]))
      .then(r => r[2])
      .then(response => ({ request: consumer, response }));consumerId
  }

  delete(consumer) {
    console.log(` - deleting ${this.ct} ${consumer.name} from spoke hub...`);
    const promiseArray = [request({
      uri: `${config.spokeHub}/${this.ctPl}/${consumer[this.ctKey]}`,
      method: 'DELETE',
      json: true,
      headers: { 'x-spoke-admin': 'abc123' }
    }).catch(e => console.log(e.message))];

    if (consumer.token) {
      console.log(` - revoking ${this.ct} ${consumer.name}'s spoke hub auth token...`);
      const authLambdaKey = `${this.ct}AuthFunctionName`
      promiseArray.push(lambda.invoke({
        FunctionName: config[authLambdaKey],
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ token: consumer.token })
      }))
    }
    console.log(` - deleting ${this.ct} ${consumer.name} from local store...`);
    promiseArray.push(storage.deleteItem(`${this.ctPl}/${consumer.consumerId}`));
    return Promise.all(promiseArray);
  }


  deleteAll() {
    if (!storage.state[this.ctPl] || !R.keys(storage.state[this.ctPl]).length) return Promise.resolve();
    return Promise.props(R.map(this.delete.bind(this), storage.state[this.ctPl]))
      .then(() => this.current = undefined)
  }

  issueAuthToken() {

    if (!this.current) return Promise.reject(`There\'s no ${this.ct} to issue a token for! Try running "${this.ct} create" to create one.`);
    if (this.current.token) return Promise.reject(`Current ${this.ct} already has token.`);

    const uid = this.current[this.ctKey];
    const consumerId = this.current.consumerId;
    const authLambdaKey = `${this.ct}AuthFunctionName`
    return lambda.invoke({
      FunctionName: config[authLambdaKey],
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({
        uid
      })
    })
      .then(response => R.tryCatch(JSON.parse, this.handleParseError)(response.Payload))
      .then(u.isError)
      .then(response => {
        const updatedConsumer = R.set(R.lensProp('token'), response.body.token, storage.state[this.ctPl][consumerId]);
        return storage.putItem(`${this.ctPl}/${consumerId}`, updatedConsumer)
          .then(() => this.current = storage.state[this.ctPl][consumerId])
          .then(() => response);
      })
      .then((result) => ({ request: { uid }, response: result.body }));

  }
}

module.exports = Consumer;