import React, { useState } from 'react';
import {
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Dices
} from 'lucide-react';
import { Button } from '../components/ui';
import { SERVER_URL } from '../hooks/useSocket';
import type { AuthUser } from '../types/game';
import { TurnUpLogo } from '../components/brand/TurnUpLogo';

export type AuthTab = 'guest' | 'login' | 'register';

export interface AuthPageProps {
  authTab: AuthTab;
  onAuthTabChange: (tab: AuthTab) => void;
  onAuthenticated: (token: string, user: AuthUser) => void;
}

const FUN_NICKNAMES = [
  'LuckyDice', 'StarRoller', 'NeonKing', 'PixelPawn',
  'BoardWizard', 'SpeedyTurn', 'GoldenUno', 'AceStriker',
  'TokenMaster', 'CosmicRider', 'VelvetRoll', 'TurboFox'
];

export const AuthPage: React.FC<AuthPageProps> = ({
  authTab,
  onAuthTabChange,
  onAuthenticated,
}) => {
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [guestUsername, setGuestUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRandomNickname = () => {
    const randomName = FUN_NICKNAMES[Math.floor(Math.random() * FUN_NICKNAMES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setGuestUsername(`${randomName}${num}`);
  };

  const handleGuestLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmed = guestUsername.trim();
    if (!trimmed) {
      setAuthError('Please enter a nickname to play as a guest.');
      return;
    }
    if (trimmed.length > 15) {
      setAuthError('Nickname must be 15 characters or less.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Guest entry failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed. Is the game server online?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmed = loginInput.trim();
    if (!trimmed || !loginPassword) {
      setAuthError('Please provide both username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: trimmed, password: loginPassword }),
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed. Is the game server online?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmedUsername = regUsername.trim();
    const trimmedEmail = regEmail.trim();

    if (!trimmedUsername || !trimmedEmail || !regPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      setAuthError('Username must be between 2 and 20 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedEmail,
          password: regPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onAuthenticated(data.token, data.user);
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection failed. Is the game server online?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: AuthTab) => {
    setAuthError('');
    onAuthTabChange(tab);
  };

  return (
    <div className="landing-card auth-card auth-card--modern">
      {/* Brand Header */}
      <div className="auth-brand-header">
        <div style={{ margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center' }}>
          <TurnUpLogo size={70} variant="mark" />
        </div>

        <h1 className="auth-brand-wordmark" style={{ margin: '0 0 10px 0', lineHeight: 1 }}>
          <TurnUpLogo variant="wordmark" size="lg" />
        </h1>

        <p className="brand-tagline">
          Turn any group chat into game night. Ludo, Monopoly, Uno &amp; more.
        </p>
      </div>

      {/* Segmented Mode Selector */}
      <div className="auth-segmented-nav" role="group" aria-label="Authentication modes">
        <button
          type="button"
          aria-pressed={authTab === 'guest'}
          className={`auth-segment-btn ${authTab === 'guest' ? 'active' : ''}`}
          onClick={() => handleTabChange('guest')}
        >
          <Sparkles size={14} /> Guest Play
        </button>
        <button
          type="button"
          aria-pressed={authTab === 'login'}
          className={`auth-segment-btn ${authTab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabChange('login')}
        >
          <KeyRound size={14} /> Sign In
        </button>
        <button
          type="button"
          aria-pressed={authTab === 'register'}
          className={`auth-segment-btn ${authTab === 'register' ? 'active' : ''}`}
          onClick={() => handleTabChange('register')}
        >
          <UserPlus size={14} /> Create Account
        </button>
      </div>

      {/* Error Message Alert */}
      {authError && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={16} className="auth-alert-icon" />
          <div className="auth-alert-text">{authError}</div>
        </div>
      )}

      {/* ── MODE 1: GUEST PLAY ── */}
      {authTab === 'guest' && (
        <form onSubmit={handleGuestLoginSubmit} className="auth-form">
          <div className="auth-mode-hint guest-hint">
            <strong>Instant Guest Mode:</strong> Jump in with a nickname. No password or email required. (Matches are not saved to a career profile).
          </div>

          <div className="auth-input-group auth-input-group--nickname">
            <input
              type="text"
              placeholder="Pick a nickname…"
              value={guestUsername}
              onChange={e => {
                setGuestUsername(e.target.value);
                if (authError) setAuthError('');
              }}
              maxLength={15}
              required
              aria-label="Guest Nickname"
              autoComplete="nickname"
              className="brand-input auth-input auth-nickname-input"
              style={{ fontSize: '17px', fontWeight: 600 }}
              disabled={isLoading}
            />
            <button
              type="button"
              className="auth-input-inline-action"
              onClick={handleRandomNickname}
              title="Generate random nickname"
              aria-label="Generate random nickname"
            >
              <Dices size={16} /> <span className="auth-input-inline-action__label">Randomize</span>
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '17px',
              borderRadius: '14px',
              fontWeight: 700,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" /> Entering Arena…
              </>
            ) : (
              <>
                Enter Arena <Dices size={18} />
              </>
            )}
          </Button>

          <div className="auth-bottom-switch">
            <span>Want to track wins &amp; match history?</span>{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => handleTabChange('register')}
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* ── MODE 2: SIGN IN ── */}
      {authTab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="auth-form">
          <div className="auth-mode-hint login-hint">
            <strong>Registered Sign In:</strong> Log in to access your profile, win rates, and recorded match history.
          </div>

          <div className="auth-input-group">
            <input
              type="text"
              placeholder="Username or Email"
              value={loginInput}
              onChange={e => {
                setLoginInput(e.target.value);
                if (authError) setAuthError('');
              }}
              required
              autoComplete="username"
              aria-label="Username or email"
              className="brand-input auth-input"
              disabled={isLoading}
            />
          </div>

          <div className="auth-input-group password-group">
            <input
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Password"
              value={loginPassword}
              onChange={e => {
                setLoginPassword(e.target.value);
                if (authError) setAuthError('');
              }}
              required
              autoComplete="current-password"
              aria-label="Password"
              className="brand-input auth-input"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowLoginPassword(p => !p)}
              aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
            >
              {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              borderRadius: '14px',
              fontWeight: 700,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" /> Signing In…
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="auth-bottom-switch">
            <span>Don&apos;t have an account yet?</span>{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => handleTabChange('register')}
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* ── MODE 3: CREATE ACCOUNT ── */}
      {authTab === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="auth-form">
          <div className="auth-perks-banner">
            <ShieldCheck size={16} color="var(--gold)" />
            <span>Unlocks match history, career win rates &amp; leaderboard ranking</span>
          </div>

          <div className="auth-input-group">
            <input
              type="text"
              placeholder="Username (2-20 characters)"
              value={regUsername}
              onChange={e => {
                setRegUsername(e.target.value);
                if (authError) setAuthError('');
              }}
              maxLength={20}
              required
              autoComplete="username"
              aria-label="Username"
              className="brand-input auth-input"
              disabled={isLoading}
            />
          </div>

          <div className="auth-input-group">
            <input
              type="email"
              placeholder="Email address"
              value={regEmail}
              onChange={e => {
                setRegEmail(e.target.value);
                if (authError) setAuthError('');
              }}
              required
              autoComplete="email"
              aria-label="Email address"
              className="brand-input auth-input"
              disabled={isLoading}
            />
          </div>

          <div className="auth-input-group password-group">
            <input
              type={showRegPassword ? 'text' : 'password'}
              placeholder="Password (minimum 6 characters)"
              value={regPassword}
              onChange={e => {
                setRegPassword(e.target.value);
                if (authError) setAuthError('');
              }}
              required
              autoComplete="new-password"
              minLength={6}
              aria-label="Password"
              className="brand-input auth-input"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowRegPassword(p => !p)}
              aria-label={showRegPassword ? 'Hide password' : 'Show password'}
            >
              {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              borderRadius: '14px',
              fontWeight: 700,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" /> Creating Account…
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="auth-bottom-switch">
            <span>Already have an account?</span>{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => handleTabChange('login')}
            >
              Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuthPage;
