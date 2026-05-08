'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!global.__prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  global.__prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

module.exports = global.__prisma;

