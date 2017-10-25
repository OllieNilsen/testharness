const cartesian = require('./cartesian');
const rp = require('request-promise');
const throttleConfig = require('../config/throttle');
const tokenConfig = require('../config/infrastructure');
const infra = require('../config/infrastructure.json');
const storage = require('./storage');
const faker = require('faker');
const clients = require('./clients');
const postcodes = require('./postcodes');
const Promise = require('bluebird');
const state = require('./state');
const R = require('ramda');
const u = require('./utils');

/*********************** RFQS *************************/

function createRfq(payload) {
  return {
    lit: false,
    requestGroup: [],
    payload
  };
}

async function makeRfqRequest(rfq) {
  const options = {
    method: "POST",
    headers: { "x-spoke-client": clients.current.token },
    uri: `${infra.spokeHub}/rfqs`,
    body: rfq,
    json: true
  }
  try {
    const result = await rp(options);
    console.log(result);
    return result;
  } catch (e) {
    console.log(e)
  }
}

function pauseFor(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}


function augmentRfq(rfq){
  const min = 100000000;
  const max = 999999999;
  const fakePhonenumber = '07' + (Math.floor(Math.random() * (max - min)) + min);// fake uk mobile number
  const phoneSetter = R.set(R.lensPath(['mainPolicyHolder', 'mobileNumber']),fakePhonenumber);
  const emailSetter = R.set(R.lensPath(['mainPolicyHolder', 'email']),faker.internet.email());
  const fnSetter = R.set(R.lensPath(['mainPolicyHolder', 'info','firstName']),faker.name.firstName());
  const lnSetter = R.set(R.lensPath(['mainPolicyHolder', 'info','lastName']),faker.name.lastName());
  const policyStartSetter = R.set(R.lensPath(['policyStart']),Date.now() + (60*60*48*1000));
  return R.pipe(phoneSetter, emailSetter, fnSetter, lnSetter, policyStartSetter)(rfq)
}

async function throttleRfqs(delay, numberOfRfqs, rfqSet, token) {
  const currentSet = R.map(augmentRfq, cartesian.takeNext(numberOfRfqs, rfqSet));

  R.map(() => state.increment('totalRfqs'), Array(currentSet.length).fill(0));
  await Promise.map(currentSet, async rfqBody => makeRfqRequest(createRfq(rfqBody), token))
  state.render();
  await pauseFor(delay);

  if (currentSet.length) {
    return throttleRfqs(delay, numberOfRfqs, rfqSet, token);
  } else {
    return state.totalRfqs;
  }
}

async function executeRfqConfigs(configs, token) {
  return Promise.map(configs, async config => {
    const pc = await postcodes.get();
    const c = R.map(R.ifElse(p => p.path === 'home/postcode', p => R.set(R.lensProp('value'), pc, p), R.identity), config);
    const sources = new cartesian.Sources();
    c.forEach(p => sources[p.type](p.path, p.value));
    const rfqSet = cartesian.lazyCartesian(sources);

    state.totalRfqsToGenerate = cartesian.sourceCountArray.reduce((a, b) => a * b, 1);
    return throttleRfqs(throttleConfig.delay, throttleConfig.batchSize, rfqSet, token)
  });
}

module.exports = {
  rfqs: {
    execute: executeRfqConfigs
  }
};