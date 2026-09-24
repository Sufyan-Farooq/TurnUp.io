import React from 'react';
import { Ban, CircleDot, WifiOff } from 'lucide-react';
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
  activePlayerId?: string;
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
  activePlayerId,
  onKickPlayer,
}) => (
  <section className="players-panel" aria-labelledby="players-panel-title">
    <div className="players-panel__header">
      <div>
        <h3 id="players-panel-title">At the table</h3>
        <p>{players.length} player{players.length === 1 ? '' : 's'} in this match</p>
      </div>
      <span className="players-panel__count">{players.length}</span>
    </div>
    <div className="players-panel__list">
      {players.map((p, idx) => (
        <div key={p.id} className={`players-panel__row ${p.id === activePlayerId ? 'is-active' : ''} ${!p.connected ? 'is-offline' : ''}`}>
          <div className="players-panel__identity">
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
            <div className="players-panel__copy">
              <strong>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</strong>
              <span>
                {!p.connected && <><WifiOff size={11} /> Reconnecting</>}
                {p.connected && p.id === activePlayerId && <><CircleDot size={11} /> Taking a turn</>}
                {p.connected && p.id !== activePlayerId && (
                  <>
                    {gameType === 'SNAKES_LADDERS' && `Tile ${positions?.[p.id] || 1}`}
                    {gameType === 'LUDO' && 'Racing home'}
                    {gameType === 'UNO' && `${getHandCount(hands?.[p.id])} cards`}
                  </>
                )}
              </span>
            </div>
          </div>
          {p.id !== currentPlayerId && (
            <Button variant="ghost" className="players-panel__kick" onClick={() => onKickPlayer(p.id)} aria-label={`Start a vote to remove ${p.name}`} title={`Vote to remove ${p.name}`}>
              <Ban size={14} />
            </Button>
          )}
        </div>
      ))}
    </div>
  </section>
);

export default ActivePlayersPanel;
