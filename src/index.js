const R = require('ramda');

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

class Generators {

  * numeric(value) {
    for (let n = value.min; n < value.max; n = value.step + n) {
      yield n;
    }
    return value.max;
  }

  * list(l) {
    console.log("L", l)
    const s = l.slice()
    while (s.length > 1) {
      yield s.shift();
    }
    return s[0];
  }

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

function *lazyCartesian(sources) {
  let allDone = false;
  const iterators = R.map(s => generators[s.type](s.value), sources);
  let values = R.map(i => i.next(), iterators);//initialise the iterators

  yield R.map(v => v.value, values);

  const recurse = (pair) => {
    iterators[pair[0]] = generators[sources[pair[0]].type](sources[pair[0]].value);
    const r = [pair[0], iterators[pair[0]].next()];
    return r;
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