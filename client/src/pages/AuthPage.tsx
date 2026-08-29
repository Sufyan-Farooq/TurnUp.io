import React, { useState } from 'react';
import { KeyRound, UserPlus, Dice5, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

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

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

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
      setAuthError('Please enter a nickname first!');
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
      <div className="landing-card" style={{ padding: '44px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div className="brand-logo-mark" style={{ width: '100px', height: '100px', borderRadius: '26px', margin: '0 auto 28px auto' }}>
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
          }}>
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

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '28px', fontSize: '12.5px' }}>
          <span
            onClick={() => { onAuthTabChange('login'); setAuthError(''); }}
            style={{ color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontFamily: "'Manrope', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <KeyRound size={13} /> Sign In
          </span>
          <span style={{ color: 'var(--muted)', opacity: 0.4 }}>|</span>
          <span
            onClick={() => { onAuthTabChange('register'); setAuthError(''); }}
            style={{ color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontFamily: "'Manrope', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <UserPlus size={13} /> Create Account
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-card" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>
      <button
        onClick={() => { onAuthTabChange('guest'); setAuthError(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none',
          color: 'var(--muted)', cursor: 'pointer',
          fontFamily: "'Manrope', sans-serif", fontSize: '13px',
          marginBottom: '24px', padding: 0,
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cloud)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
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
        }}>
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
            className="brand-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            required
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
            className="brand-input"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
            required
            className="brand-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={regPassword}
            onChange={e => setRegPassword(e.target.value)}
            required
            className="brand-input"
          />
          <Button type="submit" variant="primary" style={{ padding: '14px', fontSize: '16px', marginTop: '4px' }}>Create Account</Button>
        </form>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', fontFamily: "'Manrope', sans-serif", color: 'var(--muted)' }}>
        {authTab === 'login' ? (
          <span>
            No account?{' '}
            <span style={{ color: 'var(--violet)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onAuthTabChange('register')}>
              Create one
            </span>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <span style={{ color: 'var(--violet)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onAuthTabChange('login')}>
              Sign in
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
