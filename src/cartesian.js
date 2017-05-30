const R = require('ramda');

/**
 * The Sources class stores the sources for the generators, so that each generator can
 * be rebooted from the same source. Each source consists of a `name`, a `type`, and a
 * (possibly empty, as in the case of booleans) `value`. Possible types are `list`, `numeric`,
 * and `boolean`.  The values for `list`s must be an array. The values for `numeric`s must
 * be an object with `min`, `max`, and `step` properties, each of which must me ints.
 */
class Sources {
  list(name, value) {
    this[name] = { type: 'list', value };
  }

  numeric(name, v) {
    this[name] = { type: 'numeric', value: { min: v.min, max: v.max, step:v.step } };
  }

  boolean(name) {
    this[name] = { type: 'boolean' };
  }
}

/**
 * Class with generator methods to generate iterators of the three types `numeric`,
 * `list`, and `boolean`.
 */
class Generators {

  /**
   * Generator for a numeric iterator with min, max values and step dictating difference
   * between each value yielded.
   *
   * @param value
   * @returns int
   */
  * numeric(value) {
    for (let n = value.min; n < value.max; n = value.step + n) {
      yield n;
    }
    return value.max;
  }

  /**
   * Generator for array iterator, taking an array parameter.
   *
   * @param l (array)
   * @returns x (array member)
   */
  * list(l) {
    const s = l.slice()
    while (s.length > 1) {
      yield s.shift();
    }
    return s[0];
  }

  /**
   * Generator for boolean iterator. Yields `true`, then `false`.
   * @returns {boolean}. We need to *return* the last value in order to set
   * `done` to true.
   */
  * boolean() {
    let bool = true;
    while (bool) {
      yield bool;
      bool = !bool
    }
    return bool;
  }

}

const generators = new Generators();

function takeNext(n, iterator) {
  const a = [];
  for (let i = 0; i < n; i++) {
    const v = iterator.next();
    if (!v.done) {
      a.push(v.value);
    }
  }
  return a;
}

const getVal = R.map(R.prop('value'));

/**
 *
 * @param sources
 * @returns array
 */
function *lazyCartesian(sources) {
  let allDone = false;
  const iterators = R.map(s => generators[s.type](s.value), sources);
  let values = R.map(i => i.next(), iterators);//initialise the iterators

  yield R.map(v => v.value, values);

  const recurse = (pair) => {
    iterators[pair[0]] = generators[sources[pair[0]].type](sources[pair[0]].value);
    return [pair[0], iterators[pair[0]].next()];
  };

  while (!allDone) {
    values = R.pipe(
      R.toPairs, // extract key arrays
      R.splitWhen(val => val[1].done === false),// find initial done iterators
      R.ifElse(
        array => array[1].length > 0,
        R.identity,
        R.tap(() => allDone = true)
      ),
      v => [R.map(recurse, v[0]), v[1]],// reset all done iterators
      R.ifElse(
        v => v[1].length,
        R.over(R.lensPath([1, 0]), pair => [pair[0], iterators[pair[0]].next()]), //increment the first not-done iterator
        R.identity
      ),
      R.unnest, //flatten the array
      R.fromPairs// convert back to object.
    )(values);
    if (allDone) {
      return getVal(values);
    } else {
      yield getVal(values);
    }
  }

}

module.exports = {
  Sources,
  takeNext,
  lazyCartesian
};