import React from 'react';
import { Ban, CircleDot, Handshake, Timer, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Player, VoteKickState } from './types';

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
  voteKickState?: VoteKickState | null;
  voteKickCountdown?: number;
  onCastVote?: (vote: boolean) => void;
  onOpenVoteKickPanel?: () => void;
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
  voteKickState,
  voteKickCountdown,
  onCastVote,
  onOpenVoteKickPanel,
}) => {
  const hasActiveVoteKick = !!voteKickState;
  const targetPlayerId = voteKickState?.targetPlayerId;
  const yesCount = voteKickState ? Object.values(voteKickState.votes || {}).filter((v) => v === true).length : 0;
  const requiredVotes = voteKickState?.requiredVotes ?? 0;
  const myVote = currentPlayerId && voteKickState?.votes ? voteKickState.votes[currentPlayerId] : undefined;

  return (
    <section className="players-panel" aria-labelledby="players-panel-title">
      <div className="players-panel__header">
        <div>
          <h3 id="players-panel-title">At the table</h3>
          <p>{players.length} player{players.length === 1 ? '' : 's'} in this match</p>
        </div>
        <span className="players-panel__count">{players.length}</span>
      </div>
      <div className="players-panel__list">
        {players.map((p, idx) => {
          const isTarget = targetPlayerId === p.id;
          const isTargetMe = p.id === currentPlayerId;

          return (
            <div
              key={p.id}
              className={`players-panel__row ${p.id === activePlayerId ? 'is-active' : ''} ${!p.connected ? 'is-offline' : ''} ${isTarget ? 'is-votekick-target' : ''}`}
            >
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
                  {isTarget && (
                    <div className="players-panel__votekick-inline">
                      <span className="players-panel__votekick-tag" title="Vote kick in progress">
                        <Ban size={10} color="var(--accent-pink)" />
                        <span>Vote: {yesCount}/{requiredVotes}</span>
                        {voteKickCountdown !== undefined && (
                          <span className="players-panel__votekick-timer">
                            <Timer size={10} /> {voteKickCountdown}s
                          </span>
                        )}
                      </span>
                      {myVote !== undefined && !isTargetMe && (
                        <span
                          className="players-panel__voted-status"
                          style={{ color: myVote ? 'var(--accent-pink)' : 'var(--accent-green)' }}
                        >
                          You voted: {myVote ? 'Kick' : 'Keep'}
                        </span>
                      )}
                      {isTargetMe && (
                        <span className="players-panel__voted-status" style={{ color: 'var(--accent-pink)' }}>
                          Vote against you
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isTarget ? (
                !isTargetMe && myVote === undefined ? (
                  <div className="players-panel__quick-vote">
                    <Button
                      variant="primary"
                      className="players-panel__quick-vote-btn is-kick"
                      onClick={() => onCastVote?.(true)}
                      aria-label={`Vote to kick ${p.name}`}
                      title={`Vote to kick ${p.name}`}
                    >
                      <Ban size={12} /> Kick
                    </Button>
                    <Button
                      variant="secondary"
                      className="players-panel__quick-vote-btn is-keep"
                      onClick={() => onCastVote?.(false)}
                      aria-label={`Vote to keep ${p.name}`}
                      title={`Vote to keep ${p.name}`}
                    >
                      <Handshake size={12} /> Keep
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="players-panel__votekick-badge"
                    onClick={onOpenVoteKickPanel}
                    aria-label={`Vote kick in progress for ${p.name}. Click to view details.`}
                    title="Click to view vote details"
                  >
                    <Ban size={12} color="var(--accent-pink)" />
                    <span>{yesCount}/{requiredVotes}</span>
                    {voteKickCountdown !== undefined && (
                      <span className="players-panel__votekick-time-pill">{voteKickCountdown}s</span>
                    )}
                  </button>
                )
              ) : (
                p.id !== currentPlayerId && (
                  <Button
                    variant="ghost"
                    className="players-panel__kick"
                    onClick={() => onKickPlayer(p.id)}
                    disabled={hasActiveVoteKick}
                    aria-label={hasActiveVoteKick ? 'Another vote kick is already active' : `Start a vote to remove ${p.name}`}
                    title={hasActiveVoteKick ? 'Another vote kick is already active' : `Vote to remove ${p.name}`}
                  >
                    <Ban size={14} />
                  </Button>
                )
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActivePlayersPanel;
