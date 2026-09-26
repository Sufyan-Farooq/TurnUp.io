import React from 'react';
import { Rocket, Globe, Wrench, LogOut, Trophy, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui';
import type { AuthUser } from '../types/game';
import { TurnUpLogo } from '../components/brand/TurnUpLogo';

export interface LandingPageProps {
  /** The currently authenticated user (guest or registered). */
  currentUser: AuthUser;
  /** Whether the socket connection to the game server is currently up. */
  isConnected: boolean;
  /** Controlled value of the "join by room code" input. */
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onPlayNow: () => void;
  onBrowseRooms: () => void;
  onCreatePrivateGame: () => void;
  onJoinRoom: () => void;
  onLogout: () => void;
  /** Opens the profile and match history modal. */
  onOpenProfile: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  isConnected,
  joinCode,
  onJoinCodeChange,
  onPlayNow,
  onBrowseRooms,
  onCreatePrivateGame,
  onJoinRoom,
  onLogout,
  onOpenProfile,
}) => {
  const isGuest = currentUser.role === 'GUEST';

  return (
    <div className="landing-card" style={{ padding: '36px 32px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
      {/* Brand Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
        <TurnUpLogo size={42} variant="full" />
      </div>

      {/* User Identity Snapshot Card */}
      <div className="landing-user-badge-card">
        <div className="landing-user-avatar">
          {currentUser.username.charAt(0).toUpperCase()}
        </div>

        <div className="landing-user-info">
          <div className="landing-user-name-row">
            <span className="landing-user-name">{currentUser.username}</span>
            {isGuest ? (
              <span className="landing-role-pill guest">Guest</span>
            ) : (
              <span className="landing-role-pill verified">
                <ShieldCheck size={11} /> Member
              </span>
            )}
          </div>
          <div className="landing-user-subtext">
            {isGuest ? 'Temporary session · Stats not saved' : currentUser.email || 'Registered account'}
          </div>
        </div>

        <div className="landing-user-actions">
          <button
            type="button"
            className="landing-profile-btn"
            onClick={onOpenProfile}
            title={isGuest ? 'View guest info & upgrade' : 'View profile & match history'}
            aria-label="View profile"
          >
            {isGuest ? <Sparkles size={14} /> : <Trophy size={14} />}
            <span>{isGuest ? 'Upgrade' : 'Profile'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="landing-logout-btn"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Connection Indicator */}
      <div style={{ fontSize: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--coral)', display: 'inline-block' }} />
        <span style={{ color: isConnected ? 'var(--accent-green)' : 'var(--coral)', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isConnected ? 'Server Online' : 'Connecting to Server…'}
        </span>
      </div>

      {/* Play Now CTA */}
      <Button
        onClick={onPlayNow}
        variant="primary"
        style={{ width: '100%', padding: '15px', fontSize: '17px', borderRadius: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        disabled={!isConnected}
      >
        Play Now <Rocket size={17} />
      </Button>

      {/* Secondary Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
        <Button
          onClick={onBrowseRooms}
          variant="secondary"
          style={{ flex: 1, padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          disabled={!isConnected}
        >
          <Globe size={14} /> All Rooms
        </Button>
        <Button
          onClick={onCreatePrivateGame}
          variant="secondary"
          style={{ flex: 1.2, padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          disabled={!isConnected}
        >
          <Wrench size={14} /> Private Game
        </Button>
      </div>

      {/* Join Room Code Divider & Input */}
      <div className="brand-divider">
        <div className="brand-divider-line" />
        <span className="brand-divider-text">Join Room Code</span>
        <div className="brand-divider-line" />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Room code…"
          value={joinCode}
          onChange={e => onJoinCodeChange(e.target.value)}
          maxLength={6}
          className="brand-input"
          style={{ textTransform: 'uppercase', textAlign: 'center', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em', fontSize: '16px', flex: 1.8 }}
        />
        <Button onClick={onJoinRoom} variant="primary" style={{ flex: 1, padding: '14px', fontSize: '14px' }} disabled={!isConnected}>Join</Button>
      </div>
    </div>
  );
};

export default LandingPage;
