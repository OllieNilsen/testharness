const Promise = require('bluebird');

class U {
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

  isError(response){
    return new Promise((resolve, reject) => {
      if(response.statusCode > 399) reject(response)
      resolve(response);
    });
  }
}

module.exports = new U();