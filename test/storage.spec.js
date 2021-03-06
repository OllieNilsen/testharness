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

  beforeEach(() => Promise.all(
      [
        sut.putItem('quotes/abd432/ddee68', { a: 44, b: 44 }),
        sut.putItem('quotes/abd432/ddee69', { b: 828, v: 99 })
      ]));

  afterEach(() => {
    deleteFolderRecursive('./db/');
    sut.state = {};
  });

  it('should write files and scan them back', () => {
    return sut.scan('quotes/abd432/')
      .then(r => r.should.eql([{ a: 44, b: 44 }, { b: 828, v: 99 }]))
  });

  it('should be able to get sinlgle items', () => {
    return sut.getItem('quotes/abd432/ddee68')
      .then(q => q.should.eql({ a: 44, b: 44 }));
  });

  it('should be able to delete items', () => {
    return sut.scan('quotes/abd432/')
      .then(r => r.should.eql([{ a: 44, b: 44 }, { b: 828, v: 99 }]))
      .then(() => sut.deleteItem('quotes/abd432/ddee68'))
      .then(() => sut.scan('quotes/abd432/'))
      .then(r => r.should.eql([ { b: 828, v: 99 }]))
  });

  it('should set state', () => {
    sut.state.quotes.should.be.an('object')
  });

  it('should add object to state on put', () => {
    sut.state.should.eql({quotes: {abd432: {ddee68: {a: 44, b: 44}, ddee69: {b: 828, v:99}}}})
  });

  it('should remove an object from state on delete', () => {
    return sut.deleteItem('quotes/abd432/ddee69')
      .then(() => sut.state.should.eql({quotes: {abd432: {ddee68: {a: 44, b: 44}}}}))
  });
});
