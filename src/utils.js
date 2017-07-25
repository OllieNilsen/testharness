const Promise = require('bluebird');
const R = require('ramda');
const t = (message, x) => {
  console.log(message, x);
  return x;
}
class U {

  constructor() {
    this.tap = R.curry(t);
  }

  randomNumberBetween(min, max) {
    return min + Math.round(Math.random() * max);
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
}

module.exports = new U();