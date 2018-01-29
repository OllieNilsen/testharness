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
     "3ca8d000-a5cd-49a4-942f-55e167649a5d",
      "331d9a51-2ae9-4a4d-aaf4-7b029ee96faf",
      "24e0de54-fb2d-4927-b39c-4e960222d4ad",
      "66ebe7d4-9885-43c7-aa3e-6af3ac8b4dfe",
      "638775fe-cc94-47ee-b2ee-1205730548fe",
      "2c1774e7-084c-4c89-aa7f-ef843921f522"
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
    const result = await rp(options);cartesian
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
  const clientNamePrefix = `${faker.hacker.noun().replace(/ /g, '')}1${faker.hacker.noun().replace(/ /g, '')}`;
  return Promise.mapSeries(configNames, async name => {
    return clients.create(marketId, `${clientNamePrefix}_${name}${new Date().toString().split(' GMT')[0].replace(/ /g, '').replace(/\:/g, '')}`)
      .then(async (client) => {
        const pc = await postcodes.get();
        const c = R.map(
          R.ifElse(p => p.path === 'home/postcode', p => R.set(R.lensProp('value'), pc, p), R.identity),
          configValues[configNames.indexOf(name)]
        );
        const sources = new cartesian.Sources();
        c.forEach(p => sources[p.type](p.path, p.value));
        const rfqSet = cartesian.lazyCartesian(sources);
        return throttleRfqs(rfqSet, client.response.data.token);
      });
  });
}

module.exports =
  {
    execute: executeRfqConfigs
  };