'use strict';
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { DATABASE_URL, NODE_ENV } = require('./env');

if (!global.__prisma) {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  global.__prisma = new PrismaClient({
    adapter,
    log: NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

module.exports = global.__prisma;

