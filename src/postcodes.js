require('dotenv').config();

const R = require('ramda');
const pgp = require('pg-promise')();
const cn = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.DATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASS
};
const db = pgp(cn);

// Partition the table by msoaCode and select a random postcode within each partition.
// Order the resulting set by random (to prevent the msoaCodes to impose an order).
const query = `WITH summary AS
                 (
                   SELECT p."postcode",
                          ROW_NUMBER() OVER(PARTITION BY p."msoa" ORDER BY RANDOM()) AS rk
                   FROM postcode_data p
                   WHERE p."households" IS NOT NULL
                 )
               SELECT s.postcode FROM summary s
               WHERE s.rk = 1
               ORDER BY RANDOM()
               LIMIT 120;`;

// Execute query and map results to an array of postcodes.
module.exports.get = (async() => R.map(R.view(R.lensProp('postcode')), await db.query(query)));
