const R = require('ramda');
const u = require('./utils');


/**
 * Class with generator methods to generate iterators of the three types `numeric`,
 * `list`, and `boolean`.
 */
class FieldGenerators {

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
    const s = l.slice(); //clone the array
    while (s.length > 1) {
      yield s.shift(); // yield all but the last value
    }
    return s[0]; // return last value to set iterator to `done`
  }

  /**
   * Generator for boolean iterator. Yields `true`, then `false`.
   * @returns {boolean}.
   */
  * boolean() {
    yield true;
    return false;
  }

}

const generators = new FieldGenerators();

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
  yield u.render(values);

  /**
   * Re-initiates an iterator. It takes a key-value pair as input and returns a
   * key-value pair, where the value is the rebooted iterator.
   * @param pair
   * @returns {[*,*]}
   */
  const recurse = (pair) => {
    [key, value] = pair
    iterators[key] = generators[sources[key].type](sources[key].value);
    return [key, iterators[key].next()];
  };

  while (!allDone) {
    values = R.pipe(
      R.toPairs, // convert object keys/values into key/value array pairs
      R.splitWhen(([key, val]) => val.done === false),// split array into initial, finished, and final (not all finished) iterators.
      ([finished, unfinished]) => [R.map(recurse, finished), unfinished],// reset all the initial, finished, iterators
      R.ifElse(
        ([finished, unfinished]) => unfinished.length, // if there are unfinished iterators
        R.over(R.lensPath([1, 0]), ([key, val]) => [key, iterators[key].next()]), //increment the first unfinished iterator
        R.tap(() => allDone = true) // else, set `allDone` to `true` and pass array on unchanged
      ),
      R.unnest, //flatten the arrayq
      R.fromPairs,// convert array back to object.
    )(values);


    const rendered = u.render(values);
    if (allDone) {
      // All sub-iterators are done, so return, so that the mother-iterator is set to
      // `done`, too
      return rendered;
    } else {
      // Not all sub-iterators are done: use yield, carry on.
      yield rendered;
    }
  }

}

module.exports = {
  lazyCartesian
};
