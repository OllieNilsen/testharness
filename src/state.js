// const R = require('ramda');
// const isCounter = (val, key) => key.startsWith('total');
// const storage = require('./storage');
// const fs = require('fs');
// const filterCounts = R.pickBy(isCounter);
// const utils = require('./utils');
//
// function updateCurrent(resourceType, data){
//   return new Promise(resolve => {
//     this[resourceType] = data;
//     resolve(data);
//   });
// }
//
// class State{
//   constructor(){
//     this.totalRfqs = 0;
//     this.totalQuotes = 0;
//     this.totalSavedRfqs = 0;
//     this.updateCurrent = R.curry(updateCurrent.bind(this));
//   }
//   increment(counter){
//     if(!this.hasOwnProperty(counter)) throw new Error(`${counter} is not a counter.`);
//     this[counter] = this[counter] +1;
//   }
//
//
//   render(){
//     console.log('......................................................................');
//     console.log('Current counts:', filterCounts(this));
//   }
//
//   rotateResource(resource){
//     const pl = `${resource}s`;
//     const i = (this.resources[pl].indexOf(this[resource]) +1) % this.resources[pl].length;
//     this[resource] = this.resources[pl][i];
//   }
//
//   loadFromStorage() {
//     return new Promise((resolve, reject) => {
//       this.resources = JSON.parse(fs.readFileSync('./storage/resources.json'));
//       this.client = utils.returnRandom(this.resources.clients);
//       this.provider = utils.returnRandom(this.resources.providers);
//       resolve({ resources: this.resources, client: this.client, provider: this.provider });
//     });
//   }
// }
//
// module.exports = new State();