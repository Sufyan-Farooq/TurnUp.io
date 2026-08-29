import { useCallback, useState } from 'react';
import type { AuthUser } from '../types/game';
import { SERVER_URL } from './useSocket';

export interface UseAuthResult {
  token: string;
  currentUser: AuthUser | null;
  /** Error message from the most recent login/register/guest attempt. */
  authError: string;
  clearAuthError: () => void;
  /** POST /api/auth/login. Returns true on success (state is already updated by then). */
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  /** POST /api/auth/register. Returns true on success. */
  register: (username: string, email: string, password: string) => Promise<boolean>;
  /** POST /api/auth/guest. Returns true on success. */
  guestLogin: (username: string) => Promise<boolean>;
  /** Clears token/user from state + localStorage. Does not touch any room/socket session. */
  logout: () => void;
}

/**
 * Owns auth identity: the JWT `token`, the decoded-ish `currentUser`, and the
 * three REST calls that can produce them. Persists to the same localStorage
 * keys the app already uses (`turnup_token`, `turnup_user`) so a page reload
 * keeps the user logged in exactly as before.
 *
 * Split note: the *form field* state for the login/register/guest screens
 * (inputs, which tab is active, etc.) is UI state that belongs to the
 * AuthPage component being extracted in another slice — this hook only
 * takes the final credential values and performs the network call.
 */
export function useAuth(): UseAuthResult {
  const [token, setToken] = useState<string>(() => localStorage.getItem('turnup_token') || '');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('turnup_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [authError, setAuthError] = useState('');

  const applySession = (data: { token: string; user: AuthUser }) => {
    localStorage.setItem('turnup_token', data.token);
    localStorage.setItem('turnup_user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    setAuthError('');
    if (!usernameOrEmail.trim() || !password) {
      setAuthError('Please fill in all fields.');
      return false;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim(), password })
      });
      const data = await response.json();
      if (data.success) {
        applySession(data);
        return true;
      }
      setAuthError(data.message || 'Login failed.');
      return false;
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setAuthError('');
    if (!username.trim() || !email.trim() || !password) {
      setAuthError('Please fill in all fields.');
      return false;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
      });
      const data = await response.json();
      if (data.success) {
        applySession(data);
        return true;
      }
      setAuthError(data.message || 'Registration failed.');
      return false;
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
      return false;
    }
  }, []);

  const guestLogin = useCallback(async (username: string) => {
    setAuthError('');
    if (!username.trim()) {
      setAuthError('Please enter a nickname first!');
      return false;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await response.json();
      if (data.success) {
        applySession(data);
        return true;
      }
      setAuthError(data.message || 'Guest entry failed.');
      return false;
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('turnup_token');
    localStorage.removeItem('turnup_user');
    setToken('');
    setCurrentUser(null);
  }, []);

  return {
    token,
    currentUser,
    authError,
    clearAuthError: () => setAuthError(''),
    login,
    register,
    guestLogin,
    logout
  };
}
