/**
 * The Sources class stores the sources for the generators, so that each generator can
 * be rebooted from the same source. Each source consists of a `name`, a `type`, and a
 * (possibly empty, as in the case of booleans) `value`. Possible types are `list`, `numeric`,
 * and `boolean`.  The values for `list`s must be an array. The values for `numeric`s must
 * be an object with `min`, `max`, and `step` properties, each of which must me ints.
 */
class Sources {
  list(name, value) {
    this[name] = { type: 'list', value };
  }

  numeric(name, v) {
    this[name] = { type: 'numeric', value: { min: v.min, max: v.max, step: v.step } };
  }

  boolean(name) {
    this[name] = { type: 'boolean' };

  }
}

module.exports =  Sources ;