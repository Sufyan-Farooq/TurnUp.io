import React from 'react';
import { Dice5 } from 'lucide-react';
import { Dice3D } from '../Dice3D';
import './ludo.css';

export interface LudoActionBarProps {
  isMyTurn: boolean;
  isRolling: boolean;
  currentDiceValue: number;
  /** True when gameState.subState === 'WAITING_FOR_TOKEN_MOVE'. */
  isWaitingForTokenMove: boolean;
  /** Name of the currently active player, shown in the "waiting" prompt. */
  activePlayerName?: string;
  onRollDice: () => void;
}

/**
 * Ludo action bar: dice + roll button, or (while `WAITING_FOR_TOKEN_MOVE`) a
 * prompt telling the player to pick a token on the board. Extracted from
 * App.tsx's `renderActionBar` LUDO branch. Token selection itself happens by
 * clicking a token on `LudoBoard` (which calls `onMoveToken`), not from this
 * bar — this mirrors the original, where the action bar only shows a status
 * message during `WAITING_FOR_TOKEN_MOVE`.
 */
export const LudoActionBar: React.FC<LudoActionBarProps> = ({
  isMyTurn,
  isRolling,
  currentDiceValue,
  isWaitingForTokenMove,
  activePlayerName,
  onRollDice
}) => {
  if (isWaitingForTokenMove) {
    return (
      <div className="ludo-action-bar">
        <Dice3D value={currentDiceValue} isRolling={false} />
        <div className="ludo-action-bar__prompt">
          <span className="ludo-action-bar__prompt-text">
            {isMyTurn ? (
              <>
                <Dice5 size={18} /> You rolled a {currentDiceValue}! Select one of your tokens on the board to move it.
              </>
            ) : (
              `Waiting for ${activePlayerName ?? 'the active player'} to select a token (rolled ${currentDiceValue})...`
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="ludo-action-bar">
      <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn ? onRollDice : undefined} />

      <div>
        {isMyTurn ? (
          <button onClick={onRollDice} disabled={isRolling} className="btn-primary" style={{ padding: '16px 36px', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            {isRolling ? 'Rolling...' : (<>Roll Dice <Dice5 size={20} /></>)}
          </button>
        ) : (
          <div className="ludo-action-bar__waiting">Waiting for active player to roll...</div>
        )}
      </div>
    </div>
  );
};

export default LudoActionBar;
