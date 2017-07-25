const cartesian = require('./cartesian');
const rp = require('request-promise');
const throttleConfig = require('../config/throttle');
const tokenConfig = require('../config/infrastructure');
const infra = require('../config/infrastructure.json');
const storage = require('./storage');
const clients = require('./clients');
const Promise = require('bluebird');
const state = require('./state');
const R = require('ramda');
const u = require('./utils');


/********************** QUOTES *************************/

function getRfqIdToQuote() {
  const rfqIds = storage.getRfqIds();
  return rfqIds[Math.floor(Math.random() * rfqIds.length)];
}

/**
 *
 * @returns Promise
 */
function respondToRandom() {
  if (Date.now() % 5 !== 0) return Promise.resolve('skipping quote');
  const token = tokenConfig.providers[u.randonNumberBetween(0, tokenConfig.providers.length -1)]

  const options = {
    method: "POST",
    headers: { "x-spoke-provider": token },
    uri: `${infra.spokeHub}/${getRfqIdToQuote()}/quotes`,
    body: {
      quotePayload: {
        providerName: "AutoResponderCLI",
        productName: "autoLoan",
        loanPeriod: "months",
        loanTerm: 10,
        representativeApr: 58.33,
        customerApr: 55,
        arrangementFee: 121,
        borrowingAmount: 10000,
        repaymentAmountTotal: 32450,
        repaymentAmountMonthly: 3245,
        approvalStatus: 0.33
      },
      status: "pending",
      duration: u.randonNumberBetween(0, 604800000)
    },
    json: true
  };


  return rp(options)
    .then(() => {
      state.increment('totalQuotes')
    })
    .catch(console.log);
}


function sendQuote(delay) {
  const newDelay = Math.floor(Math.random() * (1000 * 60 * 10));
  return respondToRandom()
    .then(() => {
      return setTimeout(() => sendQuote(newDelay), delay)
    });
}

/*********************** RFQS *************************/

function createRfq(payload) {
  return {
    lit: false,
    requestGroup: [],
    payload
  };
}

function makeRfqRequest(rfq) {
  const options = {
    method: "POST",
    headers: { "x-spoke-client": clients.current.token },
    uri: `${infra.spokeHub}/rfqs`,
    body: rfq,
    json: true
  }
  return rp(options)
    .then(console.log)
    .catch(console.log)
}

function pauseFor(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay)
  });
}


function throttleRfqs(delay, numberOfRfqs, rfqSet, token) {
  const currentSet = cartesian.takeNext(numberOfRfqs, rfqSet);
  R.map(() => state.increment('totalRfqs'), Array(currentSet.length).fill(0));

  return Promise.map(currentSet, rfqBody => makeRfqRequest(createRfq(rfqBody), token))

.then(() => state.render())
    .then(() => pauseFor(delay))
    .then(() => {
      if (currentSet.length) {
        return throttleRfqs(delay, numberOfRfqs, rfqSet, token);
      } else {
        return totalRfqs;
      }
    });
}

function executeRfqConfigs(configs, token) {
  return Promise.map(configs, config => {
    const sources = new cartesian.Sources();
    config.forEach(p => sources[p.type](p.name, p.value));
    const rfqSet = cartesian.lazyCartesian(sources);

    state.totalRfqsToGenerate = cartesian.sourceCountArray.reduce((a,b) => a*b, 1);
    return throttleRfqs(throttleConfig.delay, throttleConfig.batchSize, rfqSet, token)
  });
}


module.exports = {
  rfqs: {
    execute: executeRfqConfigs
  },
  quotes: {
    execute: sendQuote
  }
};