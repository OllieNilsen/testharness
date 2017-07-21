const sinonChai = require('sinon-chai');
const chai = require('chai');
const should = chai.should();
const sut = require('../src/cartesian');
chai.use(sinonChai);

describe('index', () => {
  it('should exist', () => {
    sut.should.exist;
  });

  describe('takeNext', () => {
    let cartesian, sources;
    beforeEach(() => {
      sources = new sut.Sources();
      sources.list('something', [1, 2])
      sources.boolean('lit');
      sources.numeric('age', { min: 24, max: 25, step: 1 });
      cartesian = sut.lazyCartesian(sources);
    });

    it('should yield all possible combinations of the sources', () => {

      sut.takeNext(8, cartesian).should.eql([
        {
          "age": 24,
          "something": 1,
          "lit": true
        },
        {
          "age": 24,
          "something": 2,
          "lit": true
        },
        {
          "age": 24,
          "something": 1,
          "lit": false
        },
        {
          "age": 24,
          "something": 2,
          "lit": false
        },
        {
          "age": 25,
          "something": 1,
          "lit": true
        },
        {
          "age": 25,
          "something": 2,
          "lit": true
        },
        {
          "age": 25,
          "something": 1,
          "lit": false
        },
        {
          "age": 25,
          "something": 2,
          "lit": false
        }
      ]);

    });

    it('should stop when it has yielded all possible combinations', () => {
      sut.takeNext(8, cartesian).length.should.equal(8);
      sut.takeNext(16, cartesian).length.should.equal(0);
    });

    it('should not return more combinations than the number of possible combinations', () => {
      sut.takeNext(10, cartesian).length.should.equal(8);
    });
  });

});