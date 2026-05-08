'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/env');

const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const signRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

const verifyAccessToken = (token) =>
  jwt.verify(token, JWT_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, JWT_REFRESH_SECRET);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
