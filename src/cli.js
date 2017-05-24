'use strict';

const vorpal = require('vorpal')();
const cartesian = require('./index');
const config = require('../config');

function throttleRfqs(delay, numberOfRfqs, rfqSet) {
  setTimeout(() => {

    const currentSet = cartesian.takeNext(numberOfRfqs, rfqSet);

    console.log('These are the next 5 RFQs:\n', currentSet);
    if (currentSet.length) {
      throttleRfqs(delay, numberOfRfqs, rfqSet);
    } else {
      return;
    }
  }, delay);
}
vorpal
  .command('generate Rfqs', 'Optputs "config?"')
  .action((args, cb) => {
    const sources = new cartesian.Sources();

    config.properties.forEach(p => sources[p.type](p.name, p.value));
    const rfqSet = cartesian.lazyCartesian(sources);
    throttleRfqs(100, 5, rfqSet);
    cb();
  });

vorpal
  .delimiter('Spoke |- ')
  .show();

