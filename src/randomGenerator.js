const R = require('ramda');
const u = require('./utils');

class FieldGenerators {
  /**
   * Generator for a numeric iterator with min, max values and step dictating difference
   * between each value yielded.
   *
   * @param value
   * @returns int
   */
  * numeric(value) {
    while(true){
      yield u.randomNumberBetween(value.min, value.max);
    }
  }

  /**
   * Generator for array iterator, taking an array parameter.
   *
   * @param l (array)
   * @returns x (array member)
   */
  * list(l) {
    while(true){
      yield u.returnRandom(l);
    }
  }

  /**
   * Generator for boolean iterator. Yields `true`, then `false`.
   * @returns {boolean}.
   */
  * boolean() {
    while(true){
      yield u.returnRandom([true, false]);
    }
  }

}
 

class RandomGenerator {
  constructor(sources) {
    this.sources = sources;
    this.generators = new FieldGenerators();
  }

  * randomRfqs() {
    while (true) {
      const iterators = R.map(s => this.generators[s.type](s.value), this.sources);
      let values = R.map(i => i.next(), iterators);//initialise the iterators

      yield u.render(values);
    }
  }
}


module.exports = RandomGenerator
