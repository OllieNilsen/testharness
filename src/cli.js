'use strict';

const vorpal = require('vorpal')();
const cartesian = require('./cartesian');
const config = require('../config');
const rp = require('request-promise');
const Promise = require('bluebird');
let total = 0;

function createRfq(body) {
  body.value = 1;
  return {
    lit: false,
    body,
    hooks: {
      quotes: {
        url: "https://abc.def",
        method: "post"
      }
    },
    product: "loan",
    exchange: "finance",
    market: "loan"
  };
}

function makeRfqRequest(rfq) {
  const options = {
    method: "POST",
    uri: "https://sdaj7vue9j.execute-api.eu-west-1.amazonaws.com/develop/rfqs",
    body: rfq,
    json: true
  }

  return rp(options)
    .then(x => console.log(x))
    .catch(console.log)
}

function pauseFor(delay){
  return new Promise((resolve) =>{
    setTimeout(() => resolve(), delay)
  })
}

function throttleRfqs(delay, numberOfRfqs, rfqSet) {

  const currentSet = cartesian.takeNext(numberOfRfqs, rfqSet);
  console.log("currentSet", currentSet);
  total = total + currentSet.length;
  return Promise.map(currentSet, rfqBody => makeRfqRequest(createRfq(rfqBody)))
    .then(() => pauseFor(delay))
    .then(() => {
      if (currentSet.length) {
        console.log("Total", total);

        return throttleRfqs(delay, numberOfRfqs, rfqSet);
      } else {
        console.log("Total", total);
        return total;
      }
    })


}


vorpal
  .command('generate Rfqs', 'Optputs "config?"')
  .action((args, cb) => {
    const sources = new cartesian.Sources();

    config.rfqProperties.forEach(p => sources[p.type](p.name, p.value));
    const rfqSet = cartesian.lazyCartesian(sources);
    return throttleRfqs(config.throttle.delay, config.throttle.batchSize, rfqSet)
      .then(() => cb())
      .catch(console.log)
  });

vorpal
  .delimiter('Spoke|- ')
  .show();

