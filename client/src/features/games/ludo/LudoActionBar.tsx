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
      <section className={`ludo-action-bar ${isMyTurn ? 'is-your-turn' : ''}`} aria-live="polite">
        <div className="ludo-action-bar__dice">
          <span className="ludo-action-bar__eyebrow">Last roll</span>
          <Dice3D value={currentDiceValue} isRolling={isRolling} />
        </div>
        <div className="ludo-action-bar__prompt" role="status">
          <span className="ludo-action-bar__step">2</span>
          <span className="ludo-action-bar__prompt-copy">
            <strong className="ludo-action-bar__prompt-title">
              {isMyTurn ? 'Choose your move' : `${activePlayerName ?? 'The active player'} is choosing`}
            </strong>
            <span className="ludo-action-bar__prompt-text">
            {isMyTurn ? (
              <>
                You rolled {currentDiceValue}. Select a glowing token on the board.
              </>
            ) : (
              `They rolled ${currentDiceValue}. The turn continues when a token is moved.`
            )}
            </span>
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className={`ludo-action-bar ${isMyTurn ? 'is-your-turn' : ''}`} aria-live="polite">
      <div className="ludo-action-bar__dice">
        <span className="ludo-action-bar__eyebrow">{isRolling ? 'In motion' : 'Dice'}</span>
        <Dice3D value={currentDiceValue} isRolling={isRolling} onClick={isMyTurn && !isRolling ? onRollDice : undefined} />
      </div>

      <div className="ludo-action-bar__control">
        {isMyTurn ? (
          <button onClick={onRollDice} disabled={isRolling} className="btn-primary ludo-action-bar__roll">
            <span className="ludo-action-bar__step">1</span>
            <span>{isRolling ? 'Rolling…' : 'Roll the dice'}</span>
            <Dice5 size={20} aria-hidden="true" />
          </button>
        ) : (
          <div className="ludo-action-bar__waiting" role="status">
            <span className="ludo-action-bar__waiting-dot" aria-hidden="true" />
            <span><strong>{activePlayerName ?? 'Active player'}</strong> is up next</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default LudoActionBar;
