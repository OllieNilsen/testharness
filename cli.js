'use strict';
let vorpal = require('vorpal')();
const rfqEngine = require('./rfqEngine');
const requireDir = require('require-dir');
const configs = requireDir('../config/rfqProperties');
const R = require('ramda');
vorpal
  .command('gen', 'Recursively generates RFQs and Quotes')
  .action((args, cb) => {
    return rfqEngine.rfqs.execute(R.values(configs))
      .then(() => cb())
      .catch(console.log);
  });

vorpal
  .command('' +
    'Quotes', 'sends intermittent Quotes for random RFQs')
  .action((args, cb) => rfqEngine.quotes.execute(3000)
    .then());
process.env.minimumLogLevel = 'fatal';
const main = require('./main');
const vorpal = require('vorpal')();

let clientId;
let clientToken;
let providerId;
let providerToken;
let lastRFQ = { rfqId: null };
let lastQuote = { rfqId: null, quoteId: null };

vorpal
  .command('createClient', 'creates a client')
  .action((args, cb) => {
    return main.clients.createNewClient()
      .then(response => {
        clientId = response.response.clientId;
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb()
      })
      .catch(error => cb('Error Creating Client'));
  });

vorpal
  .command('issueClientToken', 'creates a auth token for the client')
  .action((args, cb) => {
    return main.clients.issueAuthToken(clientId)
      .then(response => {
        clientToken = response.response.token;
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb()
      })
      .catch(error => cb('Error Issuing Token'));
  });

vorpal
  .command('createProvider', 'creates a provider')
  .action((args, cb) => {
    return main.providers.createNewProvider()
      .then(response => {
        providerId = response.response.providerId;
        response.response.marketElements = {
          "exchange": "SRV",
          "market": "PETS",
          "section": "UK",
          "instrumentClass": "DOG",
          "instrument": "WLK"
        };
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb()
      })
      .catch(error => cb('Error Creating Provider'));
  });

vorpal
  .command('issueProviderToken', 'creates a auth token for the provider')
  .action((args, cb) => {
    return main.providers.issueAuthToken(providerId)
      .then(response => {
        providerToken = response.response.token;
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb()
      })
      .catch(error => cb('Error Issuing Token'));
  });

vorpal
  .command('createRFQ', 'creates an RFQ')
  .action((args, cb) => {
    return main.clients.createNewRFQ(clientToken)
      .then(response => {
        lastRFQ.rfqId = response.response.rfqId;
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb()
      })
      .catch(error => cb('Error Creating RFQ'));
  });

vorpal
  .command('getRFQ', 'gets an RFQ')
  .action((args, cb) => {
    return main.clients.getRFQ(clientToken, lastRFQ.rfqId)
      .then(response => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify({}, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response, null, 4));
        cb();
      })
      .catch(error => cb('Error Creating RFQ'));
  });

vorpal
  .command('getProviderMessages', 'queries for posted data')
  .action((args, cb) => {
    return main.providers.getPostedData()
      .then(response => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify({}, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response, null, 4));
        cb();
      })
      .catch(error => cb('No RFQ received'));
  });

vorpal
  .command('createQuote', 'creates a quote')
  .action((args, cb) => {
    return main.providers.createQuote(lastRFQ.rfqId, providerToken)
      .then(response => {
        lastQuote.rfqId = lastRFQ.rfqId;
        lastQuote.quoteId = response.response.quoteId;
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response.response, null, 4));
        cb();
      })
      .catch(error => cb('Error Creating Quote'));
  });


vorpal
  .command('getClientMessages', 'queries for posted data')
  .action((args, cb) => {
    return main.clients.getPostedData()
      .then(response => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify({}, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response, null, 4));
        cb();
      })
      .catch(error => cb('No Quotes Received'));
  });

vorpal
  .command('acceptQuote', 'accept quotes')
  .action((args, cb) => {
    return main.clients.acceptQuote(clientToken, lastQuote.rfqId, lastQuote.quoteId)
      .then((response) => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify({}, null, 4));
        cb();
      })
      .catch(error => cb(error));
  });

vorpal
  .command('rejectQuote', 'accept quotes')
  .action((args, cb) => {
    return main.clients.rejectQuote(clientToken, lastQuote.rfqId, lastQuote.quoteId)
      .then((response) => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify(response.request, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify({}, null, 4));
        cb();
      })
      .catch(error => cb(error));
  });

vorpal
  .command('getQuotes', 'get Quotes')
  .action((args, cb) => {
    return main.clients.getQuotes(clientToken, lastQuote.rfqId)
      .then(response => {
        console.log('************* REQUEST *************');
        console.log(JSON.stringify({}, null, 4));
        console.log('************* RESPONSE *************');
        console.log(JSON.stringify(response, null, 4));
        cb();
      })
      .catch(error => cb('No Quotes received'));
  });

vorpal
  .command('deleteData', 'deletes client and provider as well as tokens')
  .action((args, cb) => {
    return Promise.all([
      main.clients.deleteClient(clientId, clientToken),
      main.clients.deleteQuote(),
      main.providers.deleteProvider(providerId, providerToken),
      main.providers.deleteRFQ()
    ])
      .then(response => cb('Delete Successful'))
      .catch(error => cb('Error Deleting'));
  });


vorpal
  .delimiter('spokeHub>> ')
  .show();
