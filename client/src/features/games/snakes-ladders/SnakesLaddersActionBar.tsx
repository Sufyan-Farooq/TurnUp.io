import React from 'react';
import { Dice5 } from 'lucide-react';
import { Dice3D } from '../Dice3D';
import './snakes-ladders.css';

export interface SnakesLaddersActionBarProps {
  isMyTurn: boolean;
  isRolling: boolean;
  currentDiceValue: number;
  activePlayerName?: string;
  onRollDice: () => void;
}

/**
 * Snakes & Ladders action bar: dice + roll button. Extracted from App.tsx's
 * `renderActionBar` SNAKES_LADDERS branch. There is no END_TURN action for
 * this game (server auto-advances the turn after a roll resolves), so no
 * "end turn" control is rendered — only ROLL_DICE, gated on `isMyTurn`.
 */
export const SnakesLaddersActionBar: React.FC<SnakesLaddersActionBarProps> = ({
  isMyTurn,
  isRolling,
  currentDiceValue,
  activePlayerName,
  onRollDice
}) => {
  return (
    <section className={`sl-action-bar ${isMyTurn ? 'is-your-turn' : ''}`} aria-live="polite">
      <div className="sl-action-bar__dice">
        <span className="sl-action-bar__eyebrow">{isRolling ? 'In motion' : 'Dice'}</span>
        <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn && !isRolling ? onRollDice : undefined} />
      </div>

      <div className="sl-action-bar__control">
        {isMyTurn ? (
          <button onClick={onRollDice} disabled={isRolling} className="btn-primary sl-action-bar__roll">
            <span>{isRolling ? 'Rolling…' : 'Roll & race'}</span>
            <Dice5 size={20} aria-hidden="true" />
          </button>
        ) : (
          <div className="sl-action-bar__waiting" role="status">
            <span className="sl-action-bar__waiting-dot" aria-hidden="true" />
            <span><strong>{activePlayerName ?? 'Active player'}</strong> is rolling</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default SnakesLaddersActionBar;
