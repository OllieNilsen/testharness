const R = require('ramda');

function numeric(name, min, max, step) {
  [min, max, step].forEach(x => {
  });

  return function *() {
    for (let n = min; n < max; n = step + n) {
      yield n;
    }
  }
}

function list(name, s) {

  return function*() {
    for (let i = 0; i < s.length; i++) {
      yield  s[i];
    }
  }
}

function boolean(name) {
  return function*() {
    yield  true;
    return false;
  }
}

function takeNext(n, iterator) {
  const a = [];
  for (let i = 0; i < n; i++) {
    a.push(iterator.next().value);
  }
  return a;
}

function increment(state) {
  const done = R.pipe(
    x => x.map((val, i, arr) => {
      R.cond(x => x.done === true)
    })
  );

  return state;
}

function reset(val) {
  return iterators[val]().next();
}


function *lazyCartesianProduct(iteratorFuncs) {
  const iterators = R.map(f => f(), iteratorFuncs);
  const values =   R.map(i => i.next())(iterators);

  yield R.map(v => v.value, values);

  while (true) {
    yield R.pipe(
      R.keys, // extract key arrays
      R.map(x => [x, values[x]]), // convert values into array of key-value pairs
      R.splitWhen(val => !val[1].done),// find initial done iterators
      R.over(R.lensIndex(0), R.map(reset)),// reset all done iterators
      R.over(R.lensPath([1, 0]), pair => [ pair[0], iterators[pair[0]].next()]), //increment the first not-done iterator
      R.unnest, //flatten the array
      R.map(R.pipe(R.over(R.lensIndex(1), v => v.value))) //extract the value of each iterator
      // R.reduce()
    )(values)
  }

}

module.exports = {
  takeNext,
  numeric,
  list,
  boolean,
  lazyCartesianProduct
};
