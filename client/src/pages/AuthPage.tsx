import React, { useState } from 'react';
import { KeyRound, UserPlus, Dice5, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { SERVER_URL } from '../hooks/useSocket';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export type AuthTab = 'login' | 'register' | 'guest';

export interface AuthPageProps {
  /** Which auth card is currently shown. */
  authTab: AuthTab;
  /** Update the currently shown auth card. */
  onAuthTabChange: (tab: AuthTab) => void;
  /** Called with the token + user returned by the server on a successful
   * login, register, or guest entry. The parent is responsible for
   * persisting these (localStorage) and updating app-level auth state. */
  onAuthenticated: (token: string, user: AuthUser) => void;
}

/**
 * Landing auth screen: guest nickname entry (default), plus login/register
 * tabs. Extracted from App.tsx's inline auth card markup with no behavior
 * changes other than swapping ad hoc buttons/icons for shared primitives.
 */
export const AuthPage: React.FC<AuthPageProps> = ({ authTab, onAuthTabChange, onAuthenticated }) => {
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [authError, setAuthError] = useState('');

  const handleGuestLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!guestUsername.trim()) {
      setAuthError('Enter a nickname to continue.');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: guestUsername.trim() })
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Guest entry failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginInput.trim() || !loginPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: loginInput.trim(), password: loginPassword })
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername.trim(), email: regEmail.trim(), password: regPassword })
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed.');
    }
  };

  if (authTab === 'guest') {
    return (
      <div className="landing-card auth-card auth-card--guest">
        <div className="brand-logo-mark auth-logo">
          <Dice5 size={56} style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }} />
        </div>

        <h1 style={{ margin: '0 0 12px 0', lineHeight: 1 }}>
          <span className="wordmark-turn" style={{ fontSize: '48px' }}>turn</span>
          <span className="wordmark-up" style={{ fontSize: '48px' }}>Up</span>
          <span className="wordmark-turn" style={{ fontSize: '26px', opacity: 0.5 }}>.io</span>
        </h1>

        <p className="brand-tagline" style={{ marginBottom: '32px', fontSize: '14.5px' }}>
          Turn any group chat into game night. Ludo, Monopoly, Uno &amp; more — no downloads.
        </p>

        {authError && (
          <div style={{
            backgroundColor: 'rgba(255, 92, 102, 0.1)',
            border: '1px solid var(--coral)',
            color: 'var(--coral)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Manrope', sans-serif"
          }} role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={handleGuestLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Pick a nickname…"
            value={guestUsername}
            onChange={e => setGuestUsername(e.target.value)}
            maxLength={15}
            required
            aria-label="Nickname"
            autoComplete="nickname"
            className="brand-input"
            style={{ textAlign: 'center', fontSize: '17px', fontWeight: 600 }}
          />
          <Button
            type="submit"
            variant="primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              borderRadius: '14px',
              fontWeight: 700,
              marginTop: '4px'
            }}
          >
            Enter Arena <Dice5 size={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
          </Button>
        </form>

        <div className="auth-switcher">
          <button
            type="button"
            onClick={() => { onAuthTabChange('login'); setAuthError(''); }}
            className="auth-text-action"
          >
            <KeyRound size={13} /> Sign In
          </button>
          <span style={{ color: 'var(--muted)', opacity: 0.4 }}>|</span>
          <button
            type="button"
            onClick={() => { onAuthTabChange('register'); setAuthError(''); }}
            className="auth-text-action"
          >
            <UserPlus size={13} /> Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-card auth-card">
      <button
        type="button"
        onClick={() => { onAuthTabChange('guest'); setAuthError(''); }}
        className="auth-back-button"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '28px', fontWeight: 600, color: 'var(--cloud)', marginBottom: '24px', marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {authTab === 'login' ? <><KeyRound size={24} /> Sign In</> : <><UserPlus size={24} /> Create Account</>}
      </h2>

      {authError && (
        <div style={{
          backgroundColor: 'rgba(255, 92, 102, 0.1)',
          border: '1px solid var(--coral)',
          color: 'var(--coral)',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '13px',
          fontFamily: "'Manrope', sans-serif"
        }} role="alert">
          {authError}
        </div>
      )}

      {authTab === 'login' && (
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Username or Email"
            value={loginInput}
            onChange={e => setLoginInput(e.target.value)}
            required
            autoComplete="username"
            aria-label="Username or email"
            className="brand-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-label="Password"
            className="brand-input"
          />
          <Button type="submit" variant="primary" style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}>Sign In</Button>
        </form>
      )}

      {authTab === 'register' && (
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Username"
            value={regUsername}
            onChange={e => setRegUsername(e.target.value)}
            maxLength={15}
            required
            autoComplete="username"
            aria-label="Username"
            className="brand-input"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
            required
            autoComplete="email"
            aria-label="Email address"
            className="brand-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={regPassword}
            onChange={e => setRegPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            aria-label="Password"
            className="brand-input"
          />
          <Button type="submit" variant="primary" style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}>Create Account</Button>
        </form>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', fontFamily: "'Manrope', sans-serif", color: 'var(--muted)' }}>
        {authTab === 'login' ? (
          <span>
            No account?{' '}
            <button type="button" className="auth-inline-action" onClick={() => onAuthTabChange('register')}>
              Create one
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button type="button" className="auth-inline-action" onClick={() => onAuthTabChange('login')}>
              Sign in
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
