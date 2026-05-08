/**
 * http.js — Base HTTP client
 *
 * Single responsibility: transport layer only.
 *   • Injects Authorization header
 *   • Handles 401 → silent token refresh → retry once
 *   • Normalises errors into ApiError instances
 *   • Deduplicates concurrent refresh calls (singleton promise)
 *
 * Drop in: src/lib/http.js
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// ── Token store (in-memory + localStorage) ───────────────
const tokens = {
  access:  localStorage.getItem('gl_access')  ?? null,
  refresh: localStorage.getItem('gl_refresh') ?? null,
};

export const setTokens = (access, refresh) => {
  tokens.access  = access;
  tokens.refresh = refresh;
  if (access) {
    localStorage.setItem('gl_access',  access);
    localStorage.setItem('gl_refresh', refresh);
  } else {
    localStorage.removeItem('gl_access');
    localStorage.removeItem('gl_refresh');
  }
};

export const clearTokens = () => setTokens(null, null);

export const getAccessToken  = () => tokens.access;
export const getRefreshToken = () => tokens.refresh;

// ── Error type ────────────────────────────────────────────
export class ApiError extends Error {
  /**
   * @param {string}   message
   * @param {number}   status   HTTP status code
   * @param {object[]|null} errors  Validation errors from the server
   */
  constructor(message, status, errors = null) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  get isUnauthorized()  { return this.status === 401; }
  get isForbidden()     { return this.status === 403; }
  get isNotFound()      { return this.status === 404; }
  get isValidation()    { return this.status === 422 || (this.errors !== null); }
  get isServerError()   { return this.status >= 500; }
}

// ── Silent-refresh deduplication ─────────────────────────
let _refreshPromise = null;

const _silentRefresh = async () => {
  if (!tokens.refresh) return false;

  if (!_refreshPromise) {
    _refreshPromise = _rawFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: tokens.refresh }),
    })
      .then((data) => { setTokens(data.accessToken, data.refreshToken); return true; })
      .catch(() => { clearTokens(); return false; })
      .finally(() => { _refreshPromise = null; });
  }

  return _refreshPromise;
};

// ── Internal raw fetch (no retry) ────────────────────────
const _rawFetch = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({ message: 'Unexpected server response' }));

  if (!res.ok) {
    throw new ApiError(
      body.message ?? 'Request failed',
      res.status,
      body.errors ?? null,
    );
  }

  // Envelope: { success: true, data: ... }
  return body.data ?? body;
};

// ── Public fetch (with 401 retry) ────────────────────────
export const apiFetch = async (path, options = {}, _retried = false) => {
  try {
    return await _rawFetch(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.isUnauthorized && !_retried) {
      const refreshed = await _silentRefresh();
      if (refreshed) return apiFetch(path, options, true);
    }
    throw err;
  }
};
