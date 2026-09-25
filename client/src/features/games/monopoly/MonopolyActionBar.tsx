import React from 'react';
import { AlertTriangle, Unlock, Building2, Skull, ArrowRight } from 'lucide-react';
import { DiceDisplay, useRollAnimation } from './DiceDisplay';
import type { MonopolyGameState } from './types';
import './monopoly.css';

export interface MonopolyActionBarProps {
  gameState: MonopolyGameState;
  currentUserId: string;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onDeclareBankruptcy: () => void;
}

export const MonopolyActionBar: React.FC<MonopolyActionBarProps> = ({
  gameState, currentUserId, onRollDice, onBuyProperty, onEndTurn, onPayJailFine, onDeclareBankruptcy
}) => {
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const cashValue = gameState.gameSpecificState.cash[currentUserId] || 0;
  const subState = gameState.subState;
  const lastRoll = gameState.gameSpecificState.lastRoll;
  const { isRolling, diceValues, triggerRoll } = useRollAnimation(onRollDice, gameState.historyLength ?? 0, lastRoll);

  return (
    <section className="monopoly-action-bar" aria-label="Turn actions">
      {cashValue < 0 && subState === 'DEBT_OR_BANKRUPT' && (
        <div className="monopoly-debt-alert" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <span><strong>Your balance is ${cashValue}.</strong> Mortgage property or sell buildings to clear the debt, or declare bankruptcy.</span>
        </div>
      )}
      <div className="monopoly-action-controls">
        {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
          <div className="monopoly-action-dice" aria-label="Current dice">
            <DiceDisplay value={isRolling ? diceValues[0] : (lastRoll?.[0] || 1)} rolling={isRolling} onClick={isMyTurn && !isRolling ? triggerRoll : undefined} />
            <DiceDisplay value={isRolling ? diceValues[1] : (lastRoll?.[1] || 1)} rolling={isRolling} onClick={isMyTurn && !isRolling ? triggerRoll : undefined} />
          </div>
        )}
        {isMyTurn ? <>
          {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
            <button type="button" onClick={triggerRoll} disabled={isRolling} className="btn-primary">{isRolling ? 'Rolling…' : 'Roll dice'}</button>
          )}
          {subState === 'WAITING_FOR_JAIL_DECISION' && cashValue >= 50 && (
            <button type="button" onClick={onPayJailFine} className="btn-secondary"><Unlock size={14} /> Pay $50 fine</button>
          )}
          {subState === 'WAITING_FOR_BUY_OR_PASS' && (
            <button type="button" onClick={onBuyProperty} className="btn-primary"><Building2 size={14} /> Buy property</button>
          )}
          {(subState === 'WAITING_FOR_TURN_END' || subState === 'WAITING_FOR_BUY_OR_PASS') && (
            <button type="button" onClick={onEndTurn} className="btn-secondary">{subState === 'WAITING_FOR_BUY_OR_PASS' ? 'Pass' : 'End turn'} <ArrowRight size={14} /></button>
          )}
          {subState === 'DEBT_OR_BANKRUPT' && (
            <button type="button" onClick={onDeclareBankruptcy} className="btn-danger"><Skull size={14} /> Declare bankruptcy</button>
          )}
        </> : <span className="monopoly-waiting" role="status">Waiting for the active player</span>}
      </div>
    </section>
  );
};

export default MonopolyActionBar;
