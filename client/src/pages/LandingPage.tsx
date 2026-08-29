import React from 'react';
import { Dice5, Rocket, Globe, Wrench, LogOut } from 'lucide-react';
import { Button } from '../components/ui';

export interface LandingPageUser {
  id: string;
  username: string;
  role: string;
}

export interface LandingPageProps {
  /** The currently authenticated user (guest, registered, whatever). */
  currentUser: LandingPageUser;
  /** Whether the socket connection to the game server is currently up. */
  isConnected: boolean;
  /** Controlled value of the "join by room code" input. */
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  /** "Play Now" — parent looks for an open public lobby to drop the player
   * into, falling back to opening the game-type-selection modal if none
   * is available (mirrors the original handleFastPlay logic). */
  onPlayNow: () => void;
  /** "All Rooms" — parent should fetch the rooms list and open the rooms
   * browser (LobbyBrowserPage). */
  onBrowseRooms: () => void;
  /** "Private Game" — parent should open the game-type-selection modal. */
  onCreatePrivateGame: () => void;
  /** Submit the room-code join form. */
  onJoinRoom: () => void;
  /** Sign the current user out (parent clears token/user + localStorage). */
  onLogout: () => void;
}

/**
 * Logged-in dashboard landing card: play-now / browse-rooms / private-game
 * entry points plus a join-by-code field. Extracted from App.tsx's inline
 * "Logged In Dashboard Card" markup (previously guarded by
 * `authTab === 'guest' && currentUser`), with no behavior changes beyond
 * swapping raw buttons/emoji for shared primitives and lucide icons.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  isConnected,
  joinCode,
  onJoinCodeChange,
  onPlayNow,
  onBrowseRooms,
  onCreatePrivateGame,
  onJoinRoom,
  onLogout
}) => {
  return (
    <div className="landing-card" style={{ padding: '40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
      <div className="brand-logo-mark" style={{ width: '80px', height: '80px', margin: '0 auto 20px auto', borderRadius: '20px' }}>
        <Dice5 size={44} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }} />
      </div>

      <div style={{ marginBottom: '8px', lineHeight: 1 }}>
        <span className="wordmark-turn" style={{ fontSize: '34px' }}>turn</span>
        <span className="wordmark-up" style={{ fontSize: '34px' }}>Up</span>
        <span className="wordmark-turn" style={{ fontSize: '18px', opacity: 0.5 }}>.io</span>
      </div>

      <div style={{ marginBottom: '24px', marginTop: '12px' }}>
        <div style={{ fontSize: '15px', color: 'var(--cloud)', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
          Welcome back, <strong style={{ color: 'var(--lime)' }}>{currentUser.username}</strong>!
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: "'Manrope', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--coral)', display: 'inline-block' }} />
        <span style={{ color: isConnected ? 'var(--accent-green)' : 'var(--coral)', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isConnected ? 'Server Online' : 'Server Offline'}
        </span>
      </div>

      <Button
        onClick={onPlayNow}
        variant="primary"
        style={{ width: '100%', padding: '16px', fontSize: '17px', borderRadius: '14px', fontWeight: 700, marginBottom: '12px' }}
        disabled={!isConnected}
      >
        Play Now <Rocket size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
      </Button>

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
