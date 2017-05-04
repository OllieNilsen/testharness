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
    it('yyy', () => {
      generators = {
        list: sut.list('list', [1, 2, 3]),
        boole: sut.boolean('boole'),
        num: sut.numeric('num', 0, 10, 2)
      }
      const carteser = sut.lazyCartesianProduct(generators);
      sut.takeNext(2, carteser).should.eql([1, 2, 3])
    });
  });
});

