const R = require('ramda');
const u = require('./utils');

class RandomGenerator {
  constructor(sources) {
    this.sources = sources;
  }

  * randomRfqs() {
    while (true) {
      const values = [1, true, 24]

      yield {
        "something": 1,
        "lit": true,
        "age": 24
      }
    }
  }
}


module.exports = RandomGenerator