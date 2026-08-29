import React from 'react';
import { AlertTriangle, Unlock, Building2, Skull } from 'lucide-react';
import { DiceDisplay, useRollAnimation } from './DiceDisplay';
import type { MonopolyGameState } from './types';

export interface MonopolyActionBarProps {
  gameState: MonopolyGameState;
  currentUserId: string;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onDeclareBankruptcy: () => void;
}

/**
 * Persistent bottom control bar (roll / buy / pass / end-turn / jail-fine /
 * bankruptcy), contextual to `gameState.subState`. Mirrors the Monopoly
 * branch of App.tsx's renderActionBar.
 */
export const MonopolyActionBar: React.FC<MonopolyActionBarProps> = ({
  gameState,
  currentUserId,
  onRollDice,
  onBuyProperty,
  onEndTurn,
  onPayJailFine,
  onDeclareBankruptcy
}) => {
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const cashValue = gameState.gameSpecificState.cash[currentUserId] || 0;
  const subState = gameState.subState;
  const { isRolling, diceValues, triggerRoll } = useRollAnimation(onRollDice);
  const lastRoll = gameState.gameSpecificState.lastRoll;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
      {cashValue < 0 && subState === 'DEBT_OR_BANKRUPT' && (
        <div style={{ color: 'var(--accent-pink)', fontWeight: 'bold', fontSize: '14px', background: 'rgba(217, 4, 41, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1.5px solid var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={15} /> WARNING: You have negative cash (${cashValue})! Mortgage properties or sell houses to raise cash, or declare bankruptcy.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
          <div style={{ display: 'flex', gap: '12px', marginRight: '12px' }}>
            <DiceDisplay value={isRolling ? diceValues[0] : (lastRoll?.[0] || 1)} rolling={isRolling} onClick={isMyTurn ? triggerRoll : undefined} />
            <DiceDisplay value={isRolling ? diceValues[1] : (lastRoll?.[1] || 1)} rolling={isRolling} onClick={isMyTurn ? triggerRoll : undefined} />
          </div>
        )}

        {isMyTurn ? (
          <>
            {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
              <button onClick={triggerRoll} disabled={isRolling} className="btn-primary" style={{ padding: '12px 28px' }}>
                {isRolling ? 'Rolling...' : 'Roll Dice'}
              </button>
            )}

            {subState === 'WAITING_FOR_JAIL_DECISION' && cashValue >= 50 && (
              <button onClick={onPayJailFine} className="btn-secondary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Unlock size={14} /> Pay Jail Fine ($50)
              </button>
            )}

            {subState === 'WAITING_FOR_BUY_OR_PASS' && (
              <button onClick={onBuyProperty} className="btn-primary" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, var(--accent-gold) 0%, #e89b00 100%)', boxShadow: '0 0 15px rgba(255,183,3,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} /> Buy Property
              </button>
            )}

            {(subState === 'WAITING_FOR_TURN_END' || subState === 'WAITING_FOR_BUY_OR_PASS') && (
              <button onClick={onEndTurn} className="btn-secondary" style={{ padding: '12px 28px' }}>
                {subState === 'WAITING_FOR_BUY_OR_PASS' ? 'Decline / Pass Turn' : 'End Turn'}
              </button>
            )}

            {subState === 'DEBT_OR_BANKRUPT' && (
              <button onClick={onDeclareBankruptcy} className="btn-primary" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)', boxShadow: '0 0 15px rgba(217,4,41,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Skull size={14} /> Declare Bankruptcy
              </button>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>Waiting for active player...</span>
        )}
      </div>
    </div>
  );
};

export default MonopolyActionBar;
