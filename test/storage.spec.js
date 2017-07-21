const sinonChai = require('sinon-chai');
const chai = require('chai');
const should = chai.should();
const sut = require('../src/storage');
const fs = require('fs');
chai.use(sinonChai);
const deleteFolderRecursive = path => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

describe('storage', () => {
  after(() => {
    deleteFolderRecursive('./storage/quotes')
  });

  it('should write files and scan them back', () => {
    return Promise.all(
      [
        sut.putItem('quotes/abd432/ddee68', { a: 44, b: 44 }),
        sut.putItem('quotes/abd432/ddee69', { b: 828, v: 99 })
      ])
      .then(() => sut.scan('quotes/abd432/'))
      .then(r => r.should.eql([ { a: 44, b: 44 }, { b: 828, v: 99 } ]))
  });

  it('should be able to get sinlgle items', () => {
    return sut.getItem('quotes/abd432/ddee68')
      .then(q => q.should.eql({a: 44, b:44}));
  });
})
