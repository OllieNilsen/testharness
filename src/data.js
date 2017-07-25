const infraConfig = require('../config/infrastructure.json');
const faker = require('faker');

function client(consumerId) {
  return {
    "name": faker.name.findName().toLowerCase().split(' ').join('_'),
    "marketElements": {
      "exchange": "SRV",
      "market": "PETS",
      "section": "UK",
      "instrumentClass": "DOG",
      "instrument": "WLK"
    },
    "clientUrl": `${infraConfig.client}/${consumerId}`
  }
}

function provider(consumerId) {
  return {
    "name": faker.name.findName().toLowerCase().split(' ').join('_'),
    "marketElements": {
      "exchange": "SRV",
      "market": "PETS",
      "section": "UK",
      "instrumentClass": "DOG",
      "instrument": "WLK"
    },
    "providerUrl": `${infraConfig.provider}/${consumerId}`
  }
}

function returnRandom(array) {
  return array[Math.floor(Math.random()*array.length)];
}

function newRFQ() {
  return {
    lit: true,
    payload: {
      postcode: returnRandom(["EC1Y 2AL", "E1 7HQ", "KT10 8LG", "GL6 9BZ"]),
      dogBreed: returnRandom(["Labradoodle", "GoldenRetriever", "Shitzu", "Pug"]),
      walkDays: returnRandom([["MON", "THURS"], ["SAT"], ["MON", "WED"], ["FRI", "MON"]]),
      walkTime: returnRandom(["AM", "PM"]),
      walkLength: returnRandom([1.5, 2, 3, 0.5])
    },
    marketElements: {
      exchange: "SRV",
      market: "PETS",
      section: "UK",
      instrumentClass: "DOG",
      instrument: "WLK"
    }
  }
}

function newQuote() {
  return {
    quotePayload: {
      yearsExperience: returnRandom([1, 3, 10, 0.1]),
      firstDay: returnRandom(['2017-07-15T10:49:47.269Z', '2017-07-18T10:49:47.269Z', '2017-07-23T10:49:47.269Z']),
      cost: returnRandom([10, 20, 30, 100]),
    },
    duration: returnRandom([691200000, 691200980, 691200120]),
    status: "pending"
  }
}

module.exports = {
  client,
  provider,
  newRFQ,
  newQuote
};
