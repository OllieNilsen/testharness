'use strict';

process.env.minimumLogLevel = 'fatal';
const main = require('./main');
const vorpal = require('vorpal')();

let lastRFQ = { rfqId: null };
let lastQuote = { rfqId: null, quoteId: null };

const requireDir = require('require-dir');
const configs = requireDir('./config/rfqProperties');
const R = require('ramda');

/************ client *************/
vorpal
  .command('generate rfqs', 'Recursively generates RFQs and Quotes')
  .alias('gen')
  .action((args, cb) => {
    return main.rfqGenerator.rfqs.execute(R.values(configs))
      .then(() => cb())
      .catch(console.log);
  });


vorpal
  .command('client', 'logs the current client')
  .alias('c')
  .option('-a --all', 'get all clients in storage')
  .action(((args, cb) => {
    if (args.options.all) return cb(main.storage.state.clients);
    return cb(main.clients.current);
  }));

vorpal
  .command('client rotate', 'rotates the current client')
  .alias('cr')
  .action((args, cb) => {
    main.clients.rotateCurrent();
    cb(main.clients.current);
  });

vorpal
  .command('client create [name]', 'creates a client')
  .alias('cc')
  .option('-t --token', 'issue token for the created client')
  .action((args, cb) => {
    const issueToken = args.options.token ?
      client => main.clients.issueAuthToken(client.clientId).then(main.utils.logResponse) :
      () => Promise.resolve();

    return main.clients.create(undefined, args.name)
      .then(main.utils.logResponse)
      .then(() => issueToken(main.clients.current))
      .then(() => cb())
      .catch(error => cb(error));
  });

vorpal
  .command('client issue token', 'creates a auth token for the client')
  .alias('ct')
  .action((args, cb) => {
    return main.clients.issueAuthToken()
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(cb);
  });


vorpal
  .command('client createRFQ', 'creates an RFQ')
  .alias('crfq')
  .action((args, cb) => {
    return main.clients.createNewRFQ()
      .then(main.utils.logResponse)
      .then(response => {
        lastRFQ.rfqId = response.response.rfqId;
        cb()
      })
      .catch(cb)
    // .catch(error => cb('Error Creating RFQ'));
  });


/************ provider *************/
vorpal
  .command('provider', 'logs out the current provider')
  .alias('p')
  .option('-a --all', 'get all providers in storage')
  .action(((args, cb) => {
    if (args.options.all) return cb(main.storage.state.providers);
    return cb(main.providers.current);
  }));

vorpal
  .command('provider rotate', 'rotates the current provider')
  .alias('pr')
  .action((args, cb) => {
    main.providers.rotateCurrent();
    cb(main.providers.current);
  });

vorpal
  .command('provider create [name]', 'creates a provider')
  .alias('pc')
  .action((args, cb) => {
    const issueToken = args.options.token ?
      () => main.providers.issueAuthToken().then(main.utils.logResponse) :
      () => Promise.resolve();

    return main.providers.create(undefined,args.name)
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb(error));
  });


vorpal
  .command('provider getRFQ', 'gets an RFQ')
  .action((args, cb) => {
    return main.clients.getRFQ(clientToken, lastRFQ.rfqId)
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb('Error Creating RFQ'));
  });

vorpal
  .command('provider getMessages', 'queries for posted data')
  .alias('pgm')
  .option('-r --recursive', 'checks for messages every 5 seconds.')
  .action((args, cb) => {
    if (args.options.recursive) return main.providers.getMessagesRecursive();
    return main.providers.getMessages()
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(cb);  // .catch(() => cb('Error getting data.'));

  });

vorpal
  .command('provider createQuote', 'creates a quote')
  .action((args, cb) => {
    return main.providers.createQuote(lastRFQ.rfqId, providerToken)
      .then(main.utils.logResponse)
      .then(response => {
        lastQuote.rfqId = lastRFQ.rfqId;
        lastQuote.quoteId = response.response.quoteId;
        cb();
      })
      .catch(error => cb('Error Creating Quote'));
  });


vorpal
  .command('getClientMessages', 'queries for posted data')
  .action((args, cb) => {
    return main.clients.getMessages()
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb('No Quotes Received'));
  });

vorpal
  .command('acceptQuote', 'accept quotes')
  .action((args, cb) => {
    return main.clients.acceptQuote(clientToken, lastQuote.rfqId, lastQuote.quoteId)
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb(error));
  });

vorpal
  .command('rejectQuote', 'accept quotes')
  .action((args, cb) => {
    return main.clients.rejectQuote(clientToken, lastQuote.rfqId, lastQuote.quoteId)
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb(error));
  });

vorpal
  .command('getQuotes', 'get Quotes')
  .action((args, cb) => {
    return main.clients.getQuotes(clientToken, lastQuote.rfqId)
      .then(main.utils.logResponse)
      .then(() => cb())
      .catch(error => cb('No Quotes received'));
  });

vorpal
  .command('deleteData', 'deletes client and provider as well as tokens')
  .action((args, cb) => {
    return Promise.all([
      main.clients.deleteAll(),
      // main.clients.deleteQuote(),
      main.providers.deleteAll()
      // main.providers.deleteRFQ()
    ])
      .then(response => cb('Delete Successful'))
      .catch(error => cb(error));
  });

vorpal
  .delimiter('Poke >> ')
  .show();
