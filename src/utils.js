const Promise = require('bluebird');
const R = require('ramda');
const t = (f, x) => {
  return f(x)
    .then(() => x)
}
class U {
  constructor() {
    this.tap = R.curry(t);
    this.render = R.pipe(
      // get values for iterators
      R.map(R.prop('value')),
      // map paths to nested object structures
      obj => R.reduce((acc, key) => R.set(R.lensPath(key.split('/')), obj[key], acc), {}, R.keys(obj))
    );
  }

  wait(delay = 1000){
     return new Promise(resolve => setTimeout(resolve, delay));
  }
  randomNumberBetween(min, max) {
    return min + Math.round(Math.random() *  (max - min));
  }

  logResponse(response) {
    return new Promise((resolve) => {
      console.log('............. REQUEST ..............');
      console.log(JSON.stringify(response.request, null, 4));
      console.log('............. RESPONSE .............');
      console.log(JSON.stringify(response.response, null, 4));
      resolve(response);
    });
  }

  returnRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  isError(response) {
    return new Promise((resolve, reject) => {
      if (response.statusCode > 399) reject(response)
      resolve(response);
    });
  }

  takeNext(n, iterator) {
    const a = [];
    for (let i = 0; i < n; i++) {
      const v = iterator.next();
      if (!v.done) {
        a.push(v.value);
      }
    }
    return a;
  }

}

module.exports = new U();
