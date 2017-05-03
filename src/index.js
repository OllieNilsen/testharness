const R = require('ramda');

function interval(min, max, step) {
  [min, max, step].forEach(x => {
    if (isNaN(x)) throw new Error(`All parameters of interval() must be numbers. Got ${typeof x}`);
  });

  return function *() {
    for (let n = min; n < max; n = step + n) {
      yield n;
    }
  }
}

function listerval(s) {

  return function*() {
    for (let i = 0; i < s.length; i++) {
      yield s[i];
    }
  }
}

function boolerval() {
  return function*() {
    yield true;
    return false;
  }
}

function getNextNItems(n, iterator) {
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


function *lazyCartesianProduct(...iteratorFuncs) {
  let state = {
    done: false,
    iterators: iteratorFuncs.map(f => f()),
    values: this.iterators.map(i => i.next())
  };

  yield state.values.map(v => v.value);

  while (!state.done) {
    R.pipe(
      increment,
      checkDone,
      render
    )
  }


}


module.exports = {
  takeNext: (n, iterator) => getNextNItems(n, iterator),
  interval: interval,
  listerval: listerval,
  boolerval: boolerval,
  lazyCartesianProduct: lazyCartesianProduct
};
