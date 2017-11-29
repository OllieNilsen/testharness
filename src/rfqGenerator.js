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
const fs = require('fs');
const readFile = Promise.promisify(fs.readFile, { context: fs });

/*********************** RFQS *************************/

function createRfq(payload) {
  return {
    lit: false,
    requestGroup: [
      "8f5db820-1377-462f-ae3e-98612531deee",
      "ad3fd6d9-182f-4fbd-b464-a620bc938252",
      "1977bf7a-18c3-4368-a887-22753e8c25f5",
      "8f94b1b7-bdc8-4bfa-9315-17f2ce6e84f5",
      "e4d81fd7-2da3-49ae-880a-c278a779ec6f"
    ],
    payload
  };
}

async function makeRfqRequest(rfq) {
  const options = {
    method: "POST",
    headers: { "x-spoke-client": clients.current.data.token },
    uri: `${infra.spokeHub}/rfqs`,
    body: rfq,
    json: true
  };
  try {
    const result = await rp(options);
    console.log(result);
    return result;
  } catch (e) {
    console.log(e);
  }
}

function pauseFor(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}


function augmentRfq(rfq) {
  const min = 100000000;
  const max = 999999999;


  const emailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'me.com', 'yahoo.co.uk', 'icloud.com'
  ];


  function getRandomIndex(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const randomEmail = () => R.pipe(
    R.map(faker.hacker.abbreviation),
    R.map(x => x.toLowerCase()),
    R.join(getRandomIndex(['', '_', '-', '1', '2', '3', '4', '5', '6'])),
    x => x + Math.floor(Math.random() * 10000) + 10,
    x => x + '@',
    x => x + getRandomIndex(['gmail.com', 'yahoo.com', 'hotmail.com', 'me.com', 'icloud.com', 'yahoo.co.uk'])
  )(Array(Math.floor(Math.random() * 9) + 1));
  const fakePhonenumber = '07' + (Math.floor(Math.random() * (max - min)) + min);// fake uk mobile number
  const phoneSetter = R.set(R.lensPath(['mainPolicyHolder', 'mobileNumber']), fakePhonenumber);
  const emailSetter = R.set(R.lensPath(['mainPolicyHolder', 'email']), randomEmail());
  const fnSetter = R.set(R.lensPath(['mainPolicyHolder', 'info', 'firstName']), faker.name.firstName());
  const lnSetter = R.set(R.lensPath(['mainPolicyHolder', 'info', 'lastName']), faker.name.lastName());
  const policyStartSetter = R.set(R.lensPath(['policyStart']), Date.now() + (60 * 60 * 48 * 1000));
  return R.pipe(phoneSetter, emailSetter, fnSetter, lnSetter, policyStartSetter)(rfq);
}

async function throttleRfqs(rfqSet, token) {
  const throttleConfig = JSON.parse(await readFile(`${__dirname}/../config/throttle.json`, 'utf8'));
  const currentSet = R.map(augmentRfq, cartesian.takeNext(throttleConfig.batchSize, rfqSet));

  R.map(() => state.increment('totalRfqs'), Array(currentSet.length).fill(0));
  await Promise.map(currentSet, async rfqBody => makeRfqRequest(createRfq(rfqBody), token));
  state.render();
  await pauseFor(throttleConfig.delay);

  if (currentSet.length) {
    return throttleRfqs(rfqSet, token);
  } else {
    return state.totalRfqs;
  }
}

async function executeRfqConfigs(configs) {
  const [configNames, configValues] = [R.keys(configs), R.values(configs)];
  const marketId = undefined;
  return Promise.mapSeries(configNames, async name => {
    return clients.create(marketId, `${name} ${new Date().toString().split(' GMT')[0].replace(/ /g, '/')}`)
      .then(async (client) => {
        const pc = await postcodes.get();
        const c = R.map(
          R.ifElse(p => p.path === 'home/postcode', p => R.set(R.lensProp('value'), pc, p), R.identity),
          configValues[configNames.indexOf(name)]
        );
        const sources = new cartesian.Sources();
        c.forEach(p => sources[p.type](p.path, p.value));
        const rfqSet = cartesian.lazyCartesian(sources);
        state.totalRfqsToGenerate = cartesian.sourceCountArray.reduce((a, b) => a * b, 1);
        return throttleRfqs(rfqSet, client.response.data.token);
      });
  });
}

module.exports =
  {
    execute: executeRfqConfigs
  };