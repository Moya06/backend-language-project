'use strict';
const morgan = require('morgan');
const { NODE_ENV } = require('../config/env');

const logger = morgan(NODE_ENV === 'production' ? 'combined' : 'dev');

module.exports = { logger };
