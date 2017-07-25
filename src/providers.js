const request = require('request-promise');
const data = require('./data.js');
const config = require('../config/infrastructure.json');
const Consumer = require('./consumer');
const R = require('ramda');
const u = require('./utils');
const storage = require('./storage');

function saveMessage(m) {
  const tableName = m.rfqId ? 'rfq' : 'quote';
  const mId = m[`${tableName}Id`];

  const consumerId = this.current.consumerId;
  console.log("consumerId", `${tableName}/${consumerId}/${mId}`)
  return storage.putItem(`${tableName}/${consumerId}/${mId}`, m)
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

  getPostedData() {
    const params = {
      uri: `${config.provider}/${this.current.consumerId}`,
      method: 'GET',
      json: true
    };

    console.log('params', params)
    return request(params)
      .then(u.tap('response'))
      .then(response => response.items.map(item =>  item.body.eventPayload))
      .then(u.tap('mapped'))
      .then(R.map(saveMessage.bind(this)))
      // .then(u.tap('saved'));

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