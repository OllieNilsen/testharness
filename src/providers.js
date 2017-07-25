const request = require('request-promise');
const data = require('./data.js');
const config = require('../config/infrastructure.json');
const Consumer = require('./consumer');
const R = require('ramda');
const u = require('./utils');
const storage = require('./storage');
const Promise = require('bluebird');
const cartesian = require('./cartesian');
const policies = require('../config/quotePolicies.json');

function saveMessage(m) {
  const tableName = m.rfqId ? 'rfq' : 'quote';
  const mId = m[`${tableName}Id`];

  const consumerId = this.current.consumerId;
  console.log("consumerId", `${tableName}/${consumerId}/${mId}`)
  return storage.putItem(`${tableName}/${consumerId}/${mId}`, m)
}

function deleteFromServer(items) {
  return request({
    uri: config.provider,
    method: 'DELETE',
    json: true,
    body: R.map(R.pickBy((val, key) => ['consumerId', 'id'].indexOf(key) !== -1), items)
  });

}
class Provider extends Consumer {

  constructor() {
    super('provider');
  }

  createQuote(rfqId, token) {
    const quote = data.newQuote();
    return request({
      uri: `${config.spokeHub}/rfqs/${rfqId}/quotes`,
      method: 'POST',
      json: true,
      headers: { 'x-spoke-provider': token },
      body: quote
    }).then(response => ({ request: quote, response }));
  }

  getMessages() {
    const params = {
      uri: `${config.provider}/${this.current.consumerId}`,
      method: 'GET',
      json: true
    };

    return request(params)
      .then(response => Promise.all([
        u.tap(deleteFromServer, response.items),
        Promise.all(R.map(saveMessage.bind(this), response.items.map(item => item.body.eventPayload)))
          .then(response => ({ request: {}, response }))
      ]))
      .then(r => r[1]);
  }

  calculateQuoteDelay() {
    const max = this.current.minDelay + this.current.maxDelay;
    return Math.floor((Math.random() * max) + this.current.minDelay)
  }

  createWithPolicy() {

    const sources = new cartesian.Sources();
    policies.forEach(p => sources[p.type](p.name, p.value));
    const totalProvidersToGenerate = cartesian.sourceCountArray.reduce((a, b) => a * b, 1);
    console.log(` - generating ${totalProvidersToGenerate} providers...`)
    return Promise.map(cartesian.takeNext(totalProvidersToGenerate, cartesian.lazyCartesian(sources)), policy => {
      return super.create()
        .then(() => storage.putItem(`providers/${this.current.consumerId}`, R.merge(this.current, policy)))
    });
  }

  getMessagesRecursive() {
    const i = R.keys(storage.state.providers).length;
    const baseArray = new Array(i);
    return Promise.map(baseArray, () => {
      this.rotateCurrent();
      return this.getMessages()
        .then(u.logResponse)
    })
      .then(() => u.wait(10000))
      .then(() => this.getMessagesRecursive())
  }

  deleteRFQ() {
    return request({
      uri: `${config.provider}`,
      method: 'DELETE',
      json: true
    })
  }
}

module.exports = new Provider();