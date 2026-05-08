/**
 * useAuth.js — React hook for authentication state
 *
 * Provides login, register, logout and session rehydration.
 * Framework-agnostic state — works with any React setup (Vite, Next.js, etc.)
 * No external state library required.
 *
 * Drop in: src/hooks/useAuth.js
 *
 * Usage:
 *   const { user, loading, login, logout, register, error } = useAuth();
 *
 * For app-wide auth state wrap your app with <AuthProvider> and use
 * the useAuth() hook in any child component.
 *
 * --- AuthProvider ---
 *   import { AuthProvider } from './hooks/useAuth';
 *   <AuthProvider><App /></AuthProvider>
 *
 * --- Protected route pattern ---
 *   const { user, loading } = useAuth();
 *   if (loading) return <Spinner />;
 *   if (!user) return <Navigate to="/login" />;
 */

import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import * as authService from '../services/auth.service.js';
import { ApiError, getAccessToken } from '../lib/http.js';

// ── State shape ───────────────────────────────────────────
const initialState = {
  user:    null,   // User object or null
  loading: true,   // true while rehydrating from localStorage on mount
  error:   null,   // ApiError | Error | null
};

// ── Reducer ───────────────────────────────────────────────
const AUTH_SET_USER    = 'AUTH_SET_USER';
const AUTH_SET_LOADING = 'AUTH_SET_LOADING';
const AUTH_SET_ERROR   = 'AUTH_SET_ERROR';
const AUTH_CLEAR       = 'AUTH_CLEAR';

const reducer = (state, action) => {
  switch (action.type) {
    case AUTH_SET_USER:
      return { ...state, user: action.payload, loading: false, error: null };
    case AUTH_SET_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case AUTH_CLEAR:
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Rehydrate session on mount — if a token exists try to load the user
  useEffect(() => {
    if (!getAccessToken()) {
      dispatch({ type: AUTH_CLEAR });
      return;
    }
    authService
      .getMe()
      .then((user) => dispatch({ type: AUTH_SET_USER, payload: user }))
      .catch(() => dispatch({ type: AUTH_CLEAR }));
  }, []);

  // ── Actions ────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    dispatch({ type: AUTH_SET_LOADING, payload: true });
    dispatch({ type: AUTH_SET_ERROR, payload: null });
    try {
      const { user } = await authService.login({ email, password });
      dispatch({ type: AUTH_SET_USER, payload: user });
      return user;
    } catch (err) {
      dispatch({ type: AUTH_SET_ERROR, payload: err });
      throw err; // let the form handle it too
    }
  }, []);

  const register = useCallback(async (payload) => {
    dispatch({ type: AUTH_SET_LOADING, payload: true });
    dispatch({ type: AUTH_SET_ERROR, payload: null });
    try {
      const { user } = await authService.register(payload);
      dispatch({ type: AUTH_SET_USER, payload: user });
      return user;
    } catch (err) {
      dispatch({ type: AUTH_SET_ERROR, payload: err });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: AUTH_SET_LOADING, payload: true });
    await authService.logout();
    dispatch({ type: AUTH_CLEAR });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_SET_ERROR, payload: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────
/**
 * @returns {{
 *   user: User | null,
 *   loading: boolean,
 *   error: ApiError | Error | null,
 *   login: (credentials: {email, password}) => Promise<User>,
 *   register: (payload) => Promise<User>,
 *   logout: () => Promise<void>,
 *   clearError: () => void,
 * }}
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export { ApiError };
