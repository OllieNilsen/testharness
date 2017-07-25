const request = require('request-promise');
const data = require('./data.js');
const config = require('../config/infrastructure.json');
const Consumer = require('./consumer');

class Client extends Consumer {

  constructor() {
    super('client');
  }

  createNewRFQ() {
    if(!this.current) return Promise.reject('You don\'t have a client! Try running `create client`');
    const rfq = data.newRFQ();
    return request({
      uri: `${config.spokeHub}/rfqs`,
      method: 'POST',
      json: true,
      headers: { 'x-spoke-client': this.current.token },
      body: rfq
    }).then(response => ({ request: rfq, response }));
  }

  getRFQ(token, rfqId) {
    return request({
      uri: `${config.spokeHub}/rfqs/${rfqId}`,
      method: 'GET',
      json: true,
      headers: { 'x-spoke-client': token },
    })
  }

  getMessages() {
    return request({
      uri: `${config.client}`,
      method: 'GET',
      json: true
    })
      .then(response => response.items.map(item => item.body));
  }



  acceptQuote(token, rfqId, quoteId) {
    return request({
      uri: `${config.spokeHub}/rfqs/${rfqId}/quotes/${quoteId}`,
      method: 'PATCH',
      json: true,
      headers: { 'x-spoke-client': token },
      body: { status: 'accept' }
    }).then(response => ({ request: { status: 'accept' }, response }));
  }

  rejectQuote(token, rfqId, quoteId) {
    return request({
      uri: `${config.spokeHub}/rfqs/${rfqId}/quotes/${quoteId}`,
      method: 'PATCH',
      json: true,
      headers: { 'x-spoke-client': token },
      body: { status: 'reject' }
    }).then(response => ({ request: { status: 'reject' }, response }));
  }

  getQuotes(token, rfqId) {
    return request({
      uri: `${config.spokeHub}/rfqs/${rfqId}/quotes`,
      method: 'GET',
      json: true,
      headers: { 'x-spoke-client': token },
    })
  }
}

module.exports = new Client()