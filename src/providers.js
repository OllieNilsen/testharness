const request = require('request-promise');
const data = require('./data.js');
const config =  require('../config/infrastructure.json');
const Consumer = require('./consumer');

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
    return request({
      uri: `${config.provider}`,
      method: 'GET',
      json: true
    })
      .then(response => response.items.map(item => item.body));
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