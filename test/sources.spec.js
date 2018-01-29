const sinonChai = require('sinon-chai');
const chai = require('chai');
const should = chai.should();
chai.use(sinonChai);


describe('sources', () => {
  it('should be an object', () => {
    require('../src/sources').should.be.a('function');
  });
});

describe('Source  object', () => {
  const Sources = require('../src/sources');

  describe('list', () => {
    const source = new Sources();
    source.list('foo', [1, 2, 3]);

    it('should add a property `name`', () => {
      source.should.have.property('foo')
    });

    it('should have type `list`', () => {
      source.foo.type.should.equal('list');
    });

    it('should have a `value` of type array', () => {
      source.foo.value.should.be.an('array');
    });
  });
});