'use strict';
/**
 * Auth integration tests
 * Run: npm test
 */

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

const TEST_USER = {
  email: 'test_auth@grammarlangs.io',
  username: 'testauth',
  password: 'SecurePass123!',
  displayName: 'Test Auth User',
};

afterAll(async () => {
  // Clean up test user
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(409);
  });

  it('returns 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...TEST_USER, email: 'not-an-email', username: 'other' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/users/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.data.accessToken;
  });

  it('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
