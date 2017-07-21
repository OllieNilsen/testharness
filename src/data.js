const config = require('./../config.json');

let clientCount = 0;
let providerCount = 0;

const clients = [null, "KennelsRUS", "HomeAndDog", "DogsRUS"];
const providers = [null, "DogWalkingKings", "MoreDogWalkers", "CatWalkers"];

function newClient() {
  clientCount++;
  return {
    "name": clients[clientCount],
    "marketElements": {
      "exchange": "SRV",
      "market": "PETS",
      "section": "UK",
      "instrumentClass": "DOG",
      "instrument": "WLK"
    },
    "clientUrl": config.client
  }
}

function newProvider() {
  providerCount++;
  return {
    "name": providers[providerCount],
    "marketElements": {
      "exchange": "SRV",
      "market": "PETS",
      "section": "UK",
      "instrumentClass": "DOG",
      "instrument": "WLK"
    },
    "providerUrl": config.provider
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
  newClient,
  newProvider,
  newRFQ,
  newQuote
};
