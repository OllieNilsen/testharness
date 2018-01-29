module.exports = function() {
  return {
    files: [
      'src/**/*.js'
    ],

    tests: [
      'test/**/*spec.js'
    ],
    node: {
      path: "/usr/local/bin/node"
    }
  }

};