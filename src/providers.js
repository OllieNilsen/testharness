const AWS = require('np_aws_utils');
const lambda = new AWS.Lambda({ region: "eu-west-1" });
const request = require('request-promise');
const R = require('ramda');
const data = require('./data.js');
const config = require('../config.json');

function handleParseError(result) {
  const error = coreUtils.error(500, result);
  console.log('Authenticator response is not valid JSON', { error }, 'error');
  throw error;
}

function createNewProvider(){
  const provider = data.newProvider();
  return request({
    uri: `${config.spokeHub}/providers`,
    method: 'POST',
    json: true,
    headers: { 'x-spoke-admin': 'abc123' },
    body: provider
  }).then(response => ({request: provider, response}));
}

function issueAuthToken(uid){
  return lambda.invoke({
    FunctionName: config.providerAuthFunctionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      uid
    })
  })
  .then((result) => {
    const parsedResult = R.tryCatch(JSON.parse, handleParseError)(result.Payload);
    return { request: { uid }, response: parsedResult.body };
  })
}

function createQuote(rfqId, token){
  const quote = data.newQuote();
  return request({
    uri: `${config.spokeHub}/rfqs/${rfqId}/quotes`,
    method: 'POST',
    json: true,
    headers: { 'x-spoke-provider': token },
    body: quote
  }).then(response => ({request: quote, response}));
}


function deleteProvider(providerId, token) {
  const providerDelete = request({
    uri: `${config.spokeHub}/providers/${providerId}`,
    method: 'DELETE',
    json: true,
    headers: { 'x-spoke-admin': 'abc123' }
  });

  const tokenDelete = lambda.invoke({
    FunctionName: config.providerAuthDeleteFunctionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      token
    })
  });

  return Promise.all([providerDelete, tokenDelete]);
}

function getPostedData() {
  return request({
    uri: `${config.provider}`,
    method: 'GET',
    json: true
  })
  .then(response => response.items.map(item => item.body));
}

function deleteRFQ() {
  return request({
    uri: `${config.provider}`,
    method: 'DELETE',
    json: true
  })
}

module.exports = {
  createNewProvider,
  issueAuthToken,
  createQuote,
  getPostedData,
  deleteProvider,
  deleteRFQ
};