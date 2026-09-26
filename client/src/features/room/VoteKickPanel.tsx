import React, { useState, useEffect } from 'react';
import { Ban, Check, Handshake, Timer, X } from 'lucide-react';
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
  /** Dismisses the panel so it doesn't block the screen. */
  onClose?: () => void;
}

/**
 * Vote-kick overlay. Appears once when a vote kick starts or when prompted,
 * allowing players to cast their vote and then auto-dismissing after voting
 * (or after 3.5s if already voted) so it doesn't block the game screen.
 * The active vote status remains continuously visible on the player's character card.
 */
export const VoteKickPanel: React.FC<VoteKickPanelProps> = ({
  voteKickState,
  room,
  currentPlayerId,
  countdown,
  onCastVote,
  onClose,
}) => {
  const targetName = room?.players?.find((p) => p.id === voteKickState.targetPlayerId)?.name || 'Unknown';
  const initiatorName = room?.players?.find((p) => p.id === voteKickState.initiatorId)?.name || 'Unknown';

  const isTargetMe = voteKickState.targetPlayerId === currentPlayerId;
  const isInitiatorMe = voteKickState.initiatorId === currentPlayerId;
  const serverVote = currentPlayerId ? voteKickState.votes?.[currentPlayerId] : undefined;
  const [localVote, setLocalVote] = useState<boolean | undefined>(undefined);
  const myVote = localVote !== undefined ? localVote : serverVote;
  const countdownColor = countdown <= 15 ? 'var(--accent-pink)' : 'var(--text-muted)';

  const yesCount = Object.values(voteKickState.votes || {}).filter((v) => v === true).length;

  // Auto-dismiss if already voted on open (or if target), after 3.5s
  useEffect(() => {
    if (serverVote !== undefined || isTargetMe) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [serverVote, isTargetMe, onClose]);

  const handleVote = (vote: boolean) => {
    setLocalVote(vote);
    onCastVote(vote);
    // Give brief visual feedback ("You voted: Kick"), then close
    setTimeout(() => {
      onClose?.();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-label="Vote Kick Alert"
      style={{
        position: 'fixed',
        top: '85px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'rgba(6,2,10,0.94)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid var(--accent-pink)',
        borderRadius: '14px',
        padding: '16px 18px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(217,4,41,0.2)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'voteKickSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss vote kick popup"
        title="Dismiss popup (vote status remains visible on player card)"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 120ms ease',
        }}
      >
        <X size={15} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '24px' }}>
        <Ban size={16} color="var(--accent-pink)" />
        <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#fff' }}>Vote Kick Initiated</span>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
        Target: <strong style={{ color: '#fff' }}>{targetName}</strong>
        <br />
        Started by: {initiatorName}{isInitiatorMe ? ' (you)' : ''}
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
        <div style={{ fontSize: '12px', color: myVote ? 'var(--accent-pink)' : 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <Check size={14} /> You voted: {myVote ? 'Kick' : 'Keep'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <Button
            variant="primary"
            onClick={() => handleVote(true)}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '12px',
              background: 'linear-gradient(135deg, var(--accent-pink) 0%, #bd002a 100%)',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Ban size={13} /> Kick
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleVote(false)}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Handshake size={13} /> Keep
          </Button>
        </div>
      )}

      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px', opacity: 0.85 }}>
        Vote status is also tracked on {targetName}&apos;s player card.
      </div>
    </div>
  );
};

export default VoteKickPanel;
