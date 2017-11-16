// const R = require('ramda');
// const pgp = require('pg-promise')();
// const Promise = require('bluebird');
// const rp = require('request-promise');
// const cn = {
//   host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   database: 'postcodes',
//   user: process.env.PGUSER,
//   password: process.env.PGPASS
// };
// const db = pgp(cn);
//
// const getZooplasZed = (outcode, pageNumber = 1) => {
//   const params = {
//     uri: 'http://api.zoopla.co.uk/api/v1/zed_indices.json',
//     qs: {
//       postcode: outcode,
//       output_type: 'outcode',
//       area_type: 'postcodes',
//       api_key: 'zj2m7nj7zrrkrdah6tw3f9ev',
//       page_number: pageNumber,
//       page_size: 20
//     },
//     json: true
//   }
// console.log(params)
//   return rp(params);
// }
//
// const save = async (payload) => {
//   console.log(`Saving ${payload.name}, ${payload.zed_index}`);
//   db.query("INSERT INTO zoopla_z VALUES ($1, $2) WHERE NOT EXISTS (SELECT postcode FROM zoopla_z where postcode =  $1)", [payload.name, payload.zed_index]);
// }
//
// const wait = interval => {
//   console.log('waiting...');
//   new Promise(resolve => setTimeout(resolve, interval));
// }
//
// async function loopThroughZoooplaResultPages(outcode, currentPage = 1, totalPages = 1) {
//   let response = await getZooplasZed(outcode, currentPage)
//   await Promise.map(response.results, save);
//   totalPages = Math.ceil(response.result_count / 20);
//   if(currentPage == totalPages) return;
//   await wait(10000);
//   return await loopThroughZoooplaResultPages(outcode, currentPage + 1, totalPages);
// }
//
// async function loopThroughOutCodeArrays(outcodearrays){
//   return Promise.map(outcodearrays, loopThroughZoooplaResultPages)
// }
// const getOutcodes = async() => {
//   const query = `SELECT distinct SUBSTRING(postcode FROM 1 FOR POSITION(' ' IN postcode)) AS outcode from staging;`;
//
//   return R.pipe(
//     R.map(R.view(R.lensProp('outcode'))),
//     R.splitEvery(1)
//   )(await db.query(query));
// };
//
// const run = async () => {
//   const outcodeArrays =  await getOutcodes();
//   return await Promise.mapSeries(outcodeArrays, loopThroughOutCodeArrays);
// }
//
// module.exports.run = run;
