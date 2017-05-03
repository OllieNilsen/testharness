const sinonChai = require('sinon-chai');
const chai = require('chai');
const should = chai.should();
const sut = require('../src');
chai.use(sinonChai);

describe('index', () => {
  it('should exist', () => {
    sut.should.exist;
  });

  describe('takeNext', () => {
      it('xxx',() => {
        let booler = sut.boolerval();
        let lister = sut.listerval(['1','2', '3']);
        let inter = sut.interval(0, 10, 2);
        let carteser = sut.lazyCartesianProduct(booler, lister, inter);
        sut.takeNext(20, carteser).should.eql([2]);
      });
  });
});
