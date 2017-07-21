const AWS = require('np_aws_utils');
const lambda = new AWS.Lambda({ region: "eu-west-1" });
const R = require('ramda');
const request = require('request-promise');
const data = require('./data.js');
const config = require('../config.json');

function handleParseError(result) {
  const error = coreUtils.error(500, result);
  console.log('Authenticator response is not valid JSON', { error }, 'error');
  throw error;
}

function createNewClient(){
  const client = data.newClient();
  return request({
    uri: `${config.spokeHub}/clients`,
    method: 'POST',
    json: true,
    headers: { 'x-spoke-admin': 'abc123' },
    body: client
  }).then(response => ({request: client, response}));
}

function issueAuthToken(uid){
  return lambda.invoke({
    FunctionName: config.clientAuthFunctionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      uid
    })
  })
  .then((result) => {
    const parsedResult = R.tryCatch(JSON.parse, handleParseError)(result.Payload);
    return { request: { uid }, response: parsedResult.body }
  })
}

function createNewRFQ(token) {
  const rfq = data.newRFQ();
  return request({
    uri: `${config.spokeHub}/rfqs`,
    method: 'POST',
    json: true,
    headers: { 'x-spoke-client': token },
    body: rfq
  }).then(response => ({request: rfq, response}));
}

function getRFQ(token, rfqId) {
  return request({
    uri: `${config.spokeHub}/rfqs/${rfqId}`,
    method: 'GET',
    json: true,
    headers: { 'x-spoke-client': token },
  })
}

function getPostedData() {
  return request({
    uri: `${config.client}`,
    method: 'GET',
    json: true
  })
  .then(response => response.items.map(item => item.body));
}

function acceptQuote(token, rfqId, quoteId) {
  return request({
    uri: `${config.spokeHub}/rfqs/${rfqId}/quotes/${quoteId}`,
    method: 'PATCH',
    json: true,
    headers: { 'x-spoke-client': token },
    body: { status: 'accept' }
  }).then(response => ({request: { status: 'accept' }, response}));
}

function rejectQuote(token, rfqId, quoteId) {
  return request({
    uri: `${config.spokeHub}/rfqs/${rfqId}/quotes/${quoteId}`,
    method: 'PATCH',
    json: true,
    headers: { 'x-spoke-client': token },
    body: { status: 'reject' }
  }).then(response => ({request: { status: 'reject' }, response}));
}


function deleteClient(clientId, token) {
  const clientDelete = request({
    uri: `${config.spokeHub}/clients/${clientId}`,
    method: 'DELETE',
    json: true,
    headers: { 'x-spoke-admin': 'abc123' }
  });

  const tokenDelete = lambda.invoke({
    FunctionName: config.clientAuthDeleteFunctionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      token
    })
  });

  return Promise.all([clientDelete, tokenDelete]);
}

function deleteQuote(){
  return request({
    uri: `${config.client}`,
    method: 'DELETE',
    json: true
  })
}

function getQuotes(token, rfqId){
  return request({
    uri: `${config.spokeHub}/rfqs/${rfqId}/quotes`,
    method: 'GET',
    json: true,
    headers: { 'x-spoke-client': token },
  })
}


module.exports = {
  createNewClient,
  issueAuthToken,
  createNewRFQ,
  getPostedData,
  getRFQ,
  acceptQuote,
  getQuotes,
  deleteClient,
  deleteQuote,
  rejectQuote
};