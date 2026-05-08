/**
 * user.service.js — User domain service
 *
 * Single responsibility: user-related API calls only.
 *
 * Drop in: src/services/user.service.js
 *
 * Endpoints consumed:
 *   GET   /users/me
 *   PATCH /users/me
 *   POST  /users/me/password
 *   GET   /users/leaderboard
 */

import { apiFetch } from './http.js';

/**
 * Get the authenticated user's full profile.
 * @returns {Promise<User>}
 */
export const getProfile = () => apiFetch('/users/me');

/**
 * Update the authenticated user's profile.
 * @param {{ displayName?: string, avatarUrl?: string, nativeLanguage?: string }} payload
 * @returns {Promise<User>}
 */
export const updateProfile = (payload) =>
  apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(payload) });

/**
 * Change the authenticated user's password.
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<null>}
 */
export const changePassword = (payload) =>
  apiFetch('/users/me/password', { method: 'POST', body: JSON.stringify(payload) });

/**
 * Fetch the XP leaderboard.
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<User[]>}
 */
export const getLeaderboard = ({ limit = 20, offset = 0 } = {}) =>
  apiFetch(`/users/leaderboard?limit=${limit}&offset=${offset}`);
