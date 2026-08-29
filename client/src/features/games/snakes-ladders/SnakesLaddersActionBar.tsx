import React from 'react';
import { Dice5 } from 'lucide-react';
import { Dice3D } from '../Dice3D';
import './snakes-ladders.css';

export interface SnakesLaddersActionBarProps {
  isMyTurn: boolean;
  isRolling: boolean;
  currentDiceValue: number;
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
  onRollDice
}) => {
  return (
    <div className="sl-action-bar">
      <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn ? onRollDice : undefined} />

      <div>
        {isMyTurn ? (
          <button onClick={onRollDice} disabled={isRolling} className="btn-primary" style={{ padding: '16px 36px', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            {isRolling ? 'Rolling...' : (<>Roll Dice <Dice5 size={20} /></>)}
          </button>
        ) : (
          <div className="sl-action-bar__waiting">Waiting for active player to roll...</div>
        )}
      </div>
    </div>
  );
};

export default SnakesLaddersActionBar;
