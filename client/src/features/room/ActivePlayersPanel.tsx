import React from 'react';
import { Ban } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Player } from './types';

export interface ActivePlayersPanelProps {
  players: Player[];
  currentPlayerId: string | undefined;
  gameType: string | undefined;
  /** Snakes & Ladders board positions, keyed by player id. */
  positions?: Record<string, number>;
  /** Uno hands (own hand is an array, opponents' are redacted to a count). */
  hands?: Record<string, unknown[] | number>;
  onKickPlayer: (targetPlayerId: string) => void;
}

const getHandCount = (value: unknown[] | number | undefined): number => {
  if (typeof value === 'number') return value;
  return value?.length || 0;
};

/**
 * In-game right-hand player list for the non-Monopoly games (Monopoly has its
 * own richer `MonopolySidebar`). Extracted from App.tsx's inline
 * "Active Players" block.
 */
export const ActivePlayersPanel: React.FC<ActivePlayersPanelProps> = ({
  players,
  currentPlayerId,
  gameType,
  positions,
  hands,
  onKickPlayer,
}) => (
  <>
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
      <h3 style={{ margin: 0 }}>Active Players</h3>
    </div>
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
      {players.map((p, idx) => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className={`player-token ${p.color ? '' : `token-${idx}`}`}
              style={{
                position: 'relative',
                width: '12px',
                height: '12px',
                border: 'none',
                backgroundColor: p.color || undefined,
                boxShadow: p.color ? `0 0 5px ${p.color}` : undefined,
              }}
            />
            <span style={{ textDecoration: !p.connected ? 'line-through' : 'none' }}>{p.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {p.id !== currentPlayerId && (
              <Button
                variant="danger"
                onClick={() => onKickPlayer(p.id)}
                style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Ban size={10} /> Kick
              </Button>
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {gameType === 'SNAKES_LADDERS' && `Tile ${positions?.[p.id] || 1}`}
              {gameType === 'LUDO' && 'Home stretch'}
              {gameType === 'UNO' && `${getHandCount(hands?.[p.id])} cards`}
            </span>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default ActivePlayersPanel;
