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
    this[name] = { type: 'numeric', value: { min: v.min, max: v.max, step: v.step } };
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
   * @param arrayValue (array)
   * @returns x (array member)
   */
  * list(arrayValue) {
    const clonedValue = arrayValue.slice(); //clone the array
    while (clonedValue.length > 1) {
      yield clonedValue.shift(); // yield all but the last value
    }
    return clonedValue[0]; // return last value to set iterator to `done`
  }

  /**
   * Generator for boolean iterator. Yields `true`, then `false`.
   * @returns {boolean}.z§
   *
   */
  * boolean() {
    yield true;
    return false;
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
 * Generator function to generate all combinations of properties for an RFQ.
 * It takes a sources object as a param to invoke appropriate generators for the
 * property iterators. It is `done` when all property iterators are `done`.
 * It works by splitting an array of iterators into two parts: an initial sub-array of
 * finished iterators, and a final array of unfinished iterators. It resets each of the
 * initial, finished iterators, and increments the first of the final, unfinished iterators.
 * This process is iterated until all embedded iterators are done, so the final array is empty. A semi-global
 * variable `allDone` is then set to `true` and the overall iterator is set to `done`, and the process
 * is terminated.
 *
 * @param sources
 * @returns array
 */
function *lazyCartesian(sources) {
  let allDone = false;
  // map the sources object to an iterators object, keyed in the same way as the sources.
  const iterators = R.map(s => generators[s.type](s.value), sources);
  let values = R.map(i => i.next(), iterators);//initialise the iterators

  // yield the rendered version of the values object.
  yield R.map(v => v.value, values);

  /**
   * Re-initiates an iterator. It takes a key-value pair as input and returns a
   * key-value pair, where the value is the rebooted iterator.
   * @param pair
   * @returns {[*,*]}
   */
  const recurse = (pair) => {
    iterators[pair[0]] = generators[sources[pair[0]].type](sources[pair[0]].value);
    return [pair[0], iterators[pair[0]].next()];
  };

  while (!allDone) {
    values = R.pipe(
      R.toPairs, // convert object keys/values into key/value array pairs
      R.splitWhen(val => val[1].done === false),// split array into initial, finished, and final (not all finished) iterators.
      v => [R.map(recurse, v[0]), v[1]],// reset all the initial, finished, iterators
      R.ifElse(
        v => v[1].length, // if there are unfinished iterators
        R.over(R.lensPath([1, 0]), pair => [pair[0], iterators[pair[0]].next()]), //increment the first unfinished iterator
        R.tap(() => allDone = true) // else, set `allDone` to `true` and pass array on unchanged
      ),
      R.unnest, //flatten the array
      R.fromPairs// convert array back to object.
    )(values);

    if (allDone) {
      // All sub-iterators are done, so return, so that the mother-iterator is set to
      // `done`, too
      return getVal(values);
    } else {
      // Not all sub-iterators are done: use yield, carry on.
      yield getVal(values);
    }
  }

}

module.exports = {
  Sources,
  takeNext,
  lazyCartesian
};