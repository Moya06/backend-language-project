/**
 * auth.service.js — Authentication domain service
 *
 * Single responsibility: auth-specific API calls only.
 * Depends on http.js for transport; manages tokens via setTokens/clearTokens.
 *
 * Drop in: src/services/auth.service.js
 *
 * Endpoints consumed:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh
 *   POST /auth/logout
 *   GET  /auth/me
 */

import { apiFetch, setTokens, clearTokens } from './http.js';

/**
 * Register a new account.
 * @returns {Promise<{ user: User, accessToken: string, refreshToken: string }>}
 */
export const register = async ({ email, username, password, displayName = null, nativeLanguage = 'en' }) => {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password, displayName, nativeLanguage }),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
};

/**
 * Log in with email + password.
 * Stores tokens automatically.
 * @returns {Promise<{ user: User, accessToken: string, refreshToken: string }>}
 */
export const login = async ({ email, password }) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
};

/**
 * Silently refresh the access token using the stored refresh token.
 * Called automatically by http.js on 401 — you rarely need this directly.
 * @returns {Promise<boolean>} true if succeeded
 */
export const refreshSession = async () => {
  const { getRefreshToken } = await import('./http.js');
  const token = getRefreshToken();
  if (!token) return false;
  try {
    const data = await apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    }, true); // _retried = true to avoid recursion
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
};

/**
 * Log out: invalidates the refresh token on the server and clears local tokens.
 * Safe to call even if already logged out.
 */
export const logout = async () => {
  const { getRefreshToken } = await import('./http.js');
  const token = getRefreshToken();
  try {
    if (token) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token }),
      });
    }
  } finally {
    clearTokens();
  }
};

/**
 * Fetch the currently authenticated user profile.
 * Useful to rehydrate session on page load.
 * @returns {Promise<User>}
 */
export const getMe = () => apiFetch('/auth/me');
