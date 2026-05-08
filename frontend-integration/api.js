/**
 * api.js — Public API facade
 *
 * Re-exports every service function from the domain services + http client.
 * Import from here so you only need one import statement in most files:
 *
 *   import { login, logout, getProfile, getLeaderboard } from '@/services/api';
 *
 * For auth state management use the React hook instead:
 *   import { useAuth, AuthProvider } from '@/hooks/useAuth';
 */

// ── HTTP primitives ───────────────────────────────────────
export { apiFetch, setTokens, clearTokens, getAccessToken, getRefreshToken, ApiError } from './http.js';

// ── Auth ──────────────────────────────────────────────────
export { login, register, logout, refreshSession, getMe } from './auth.service.js';

// ── Users ─────────────────────────────────────────────────
export { getProfile, updateProfile, changePassword, getLeaderboard } from './user.service.js';
