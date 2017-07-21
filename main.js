process.env.AWS_XRAY_CONTEXT_MISSING='LOG_ERROR';
module.exports = require('require-dir')('./src');
