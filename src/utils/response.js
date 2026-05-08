'use strict';

/**
 * Uniform API response envelope
 */
const ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const created = (res, data) => ok(res, data, 201);

const noContent = (res) => res.status(204).send();

const fail = (res, message, statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const unauthorized = (res, message = 'Unauthorized') => fail(res, message, 401);

const forbidden = (res, message = 'Forbidden') => fail(res, message, 403);

const notFound = (res, resource = 'Resource') => fail(res, `${resource} not found`, 404);

const serverError = (res, message = 'Internal server error') => fail(res, message, 500);

module.exports = { ok, created, noContent, fail, unauthorized, forbidden, notFound, serverError };
