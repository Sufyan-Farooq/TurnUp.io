import React from 'react';
import { Trophy, Medal, RotateCw, Dice5, Layers, Building2, Component, Hourglass } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Room } from './types';

export interface GameOverPlayerLike {
  id: string;
  name: string;
  color?: string;
}

export interface GameOverScreenProps {
  room: Room;
  /** Current user's player id. */
  currentPlayerId: string | undefined;
  /** `gameState.gameSpecificState.rankings` — ordered array of player ids, winner first. May be empty. */
  rankings: string[];
  /** `gameState.winnerId`, used as a single-winner fallback when `rankings` is empty. */
  winnerId: string | null | undefined;
  /**
   * Looks up a player's display name/color by id. Parent supplies this so it
   * can check both `room.players` and `gameState.players` as the original
   * code did.
   */
  getPlayerDetails: (id: string) => GameOverPlayerLike | { name: string; color?: string };
  /** Host-only: emits `rematch`. */
  onRematch: () => void;
  /** Host-only: emits `change_game_type` with `{ gameType }`. */
  onChangeGameType: (gameType: 'LUDO' | 'UNO' | 'MONOPOLY' | 'SNAKES_LADDERS') => void;
}

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

/**
 * Extracted from App.tsx's `room?.status === 'ENDED'` overlay (~line 5535).
 * Shows final standings (ranked list, or a single-winner card when no
 * `rankings` array is present) and, for the host, rematch / change-game-type
 * controls; non-hosts see a "waiting for host" message.
 */
export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  room,
  currentPlayerId,
  rankings,
  winnerId,
  getPlayerDetails,
  onRematch,
  onChangeGameType,
}) => {
  const hasRankings = rankings.length > 0;
  const isHost = room.hostId === currentPlayerId;

  return (
    <div className="victory-overlay">
      <div
        className="glass-panel victory-card animate-victory-modal"
        style={{
          border: '1.5px solid rgba(108, 60, 233, 0.4)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 50px rgba(108, 60, 233, 0.25)',
        }}
      >
        <h1 className="victory-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Trophy /> Victory!
        </h1>
        <p className="victory-subtitle">Match over — here are the final standings:</p>

        {/* Standings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', textAlign: 'left' }}>
          {hasRankings ? (
            rankings.map((pId, idx) => {
              const details = getPlayerDetails(pId);
              const isMe = pId === currentPlayerId;
              const medalColor = idx < 3 ? medalColors[idx] : 'var(--muted)';

              return (
                <div
                  key={pId}
                  className={`ranking-row${isMe ? ' is-me' : ''}`}
                  style={{ animation: `slideUp 0.4s ease-out forwards ${idx * 0.1}s`, opacity: 0, transform: 'translateY(15px)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Medal size={20} color={medalColor} />
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isMe ? 'var(--cloud)' : 'var(--cloud-dim)' }}>
                      {details.name} {isMe && <span style={{ color: 'var(--lime)', fontSize: '12px' }}>(You)</span>}
                    </span>
                  </div>
                  <span className="ranking-place" style={{ color: medalColor }}>
                    {idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`}
                  </span>
                </div>
              );
            })
          ) : (
            (() => {
              const resolvedWinnerId = winnerId || room?.players?.[0]?.id || '';
              const details = getPlayerDetails(resolvedWinnerId);
              const isMe = resolvedWinnerId === currentPlayerId;
              return (
                <div className="ranking-row" style={{ background: 'rgba(255, 194, 71, 0.08)', borderColor: 'rgba(255, 194, 71, 0.35)', justifyContent: 'center', gap: '16px' }}>
                  <Trophy size={26} color="var(--gold)" />
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '18px', color: 'var(--cloud)' }}>
                    {details.name} {isMe && <span style={{ color: 'var(--lime)' }}>(You)</span>}
                  </span>
                  <span className="ranking-place" style={{ color: 'var(--gold)' }}>Winner</span>
                </div>
              );
            })()
          )}
        </div>

        {/* Host Control Actions */}
        {isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={onRematch}
              style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RotateCw size={16} /> Play Rematch
            </Button>

            <div className="brand-divider">
              <div className="brand-divider-line" />
              <span className="brand-divider-text">New Game</span>
              <div className="brand-divider-line" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Button variant="secondary" onClick={() => onChangeGameType('LUDO')} style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Dice5 size={14} /> Ludo
              </Button>
              <Button variant="secondary" onClick={() => onChangeGameType('UNO')} style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Layers size={14} /> Uno
              </Button>
              <Button variant="secondary" onClick={() => onChangeGameType('MONOPOLY')} style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Building2 size={14} /> Monopoly
              </Button>
              <Button variant="secondary" onClick={() => onChangeGameType('SNAKES_LADDERS')} style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Component size={14} /> Snakes
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(108, 60, 233, 0.2)', color: 'var(--muted)', fontSize: '13px', fontFamily: "'Manrope', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hourglass size={14} /> Waiting for <strong style={{ color: 'var(--cloud)' }}>{getPlayerDetails(room.hostId).name}</strong> to pick the next match…
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;
