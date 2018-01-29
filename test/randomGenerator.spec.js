const R = require('ramda');
const chai = require('chai');

const Sources = require('../src/sources');
const u = require('../src/utils')
const sinonChai = require('sinon-chai');

const should = chai.should();
chai.use(sinonChai);

describe.only('randomGenerator', () => {
  it('should be an object', () => {
    require('../src/randomGenerator').should.be.a('function');
  });

  describe('takeNext flat sources', () => {
    const RandomGenerator= require('../src/randomGenerator');
    const sources = new Sources();
    sources.list('something', [1, 2])
    sources.boolean('lit');
    sources.numeric('age', { min: 24, max: 25, step: 1 });
    const generator = new RandomGenerator(sources).randomRfqs();

    it('should yield the requested number of rfqs', () => {
      const n = 11;
      u.takeNext(n, generator).length.should.equal(n);
    });

    it('should have all properties of the sources', () => {
      const rfq = u.takeNext(1, generator)[0];
      R.keys(sources).should.eql(R.keys(rfq));
    });

    describe('takeNext nested sources', () => {
      const RandomGenerator= require('../src/randomGenerator');
      const sources = new Sources();
      sources.list('something/path', [1, 2]);
      sources.boolean('lit');
      const generator = new RandomGenerator(sources).randomRfqs();

      it('should create an rfq with nested values', () => {
        const rfq = u.takeNext(1, generator)[0];

        console.log(u.render(sources));

        u.render(rfq).something.should.exist;
        u.render(rfq).something.path.should.exist;
      })
    })

  });
});