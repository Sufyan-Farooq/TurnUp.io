import React from 'react';
import { Ban, Handshake, Timer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Room, VoteKickState } from './types';

export interface VoteKickPanelProps {
  voteKickState: VoteKickState;
  room: Room | null;
  /** Current user's player id. */
  currentPlayerId: string | undefined;
  /** Seconds remaining, ticked by the parent (server sends `timeoutSeconds: 60` on `vote_kick_started`). */
  countdown: number;
  /** Emits `cast_kick_vote` with `{ vote: kick }`. */
  onCastVote: (vote: boolean) => void;
}

/**
 * Extracted from App.tsx's vote-kick overlay (~line 5458). Displayed while
 * `voteKickState` is non-null. Shows the target/initiator names, yes-vote
 * tally vs. required votes, a countdown, and Kick/Keep buttons (hidden for
 * the target player, replaced with a status line once the current user has
 * voted).
 */
export const VoteKickPanel: React.FC<VoteKickPanelProps> = ({ voteKickState, room, currentPlayerId, countdown, onCastVote }) => {
  const targetName = room?.players?.find((p) => p.id === voteKickState.targetPlayerId)?.name || 'Unknown';
  const initiatorName = room?.players?.find((p) => p.id === voteKickState.initiatorId)?.name || 'Unknown';

  const isTargetMe = voteKickState.targetPlayerId === currentPlayerId;
  const myVote = currentPlayerId ? voteKickState.votes[currentPlayerId] : undefined;
  const countdownColor = countdown <= 15 ? 'var(--accent-pink)' : 'var(--text-muted)';

  const yesCount = Object.values(voteKickState.votes).filter((v) => v === true).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: '85px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        background: 'rgba(6,2,10,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid var(--accent-pink)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(217,4,41,0.15)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ban size={16} color="var(--accent-pink)" />
        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#fff' }}>Vote Kick Initiated</span>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
        Target: <strong style={{ color: '#fff' }}>{targetName}</strong>
        <br />
        Started by: {initiatorName}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>
          Yes votes: {yesCount} / {voteKickState.requiredVotes}
        </span>
        <span style={{ color: countdownColor, fontWeight: countdown <= 15 ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Timer size={12} /> {countdown}s
        </span>
      </div>

      {isTargetMe ? (
        <div style={{ fontSize: '12px', color: 'var(--accent-pink)', fontStyle: 'italic', marginTop: '6px' }}>
          A vote kick has been started against you. Waiting for other players...
        </div>
      ) : myVote !== undefined ? (
        <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontStyle: 'italic', marginTop: '6px' }}>
          You voted: {myVote ? 'Kick' : 'Keep'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <Button
            variant="primary"
            onClick={() => onCastVote(true)}
            style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #bd002a 100%)', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Ban size={13} /> Kick
          </Button>
          <Button
            variant="secondary"
            onClick={() => onCastVote(false)}
            style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Handshake size={13} /> Keep
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoteKickPanel;
