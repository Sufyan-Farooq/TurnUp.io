import React from 'react';
import { ArrowRightCircle, Layers, Megaphone } from 'lucide-react';
import type { UnoGameStateLike } from './uno.types';
import { getOwnHand, isCardPlayable } from './uno.types';

export interface UnoActionBarProps {
  gameState: UnoGameStateLike;
  currentUserId: string;
  /** Draw a card (or, during PLAY_OR_PASS, "pass" — the engine treats a second
   *  DRAW_CARD in that substate as passing rather than drawing again). */
  onDrawCard: () => void;
  /** Play a card by index. `selectedColor` is never passed from here — wild-card
   *  color selection is owned by whichever parent wires up `UnoColorPicker`. */
  onPlayCard: (cardIndex: number, selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  /** DECLARE_UNO is an out-of-turn action, enabled whenever hand size <= 2. */
  onDeclareUno: () => void;
}

/**
 * Draw / declare-UNO controls for the current player.
 *
 * Per-opponent "Challenge UNO" controls are rendered in `UnoBoard` instead
 * (challenge targets a specific opponent seat, which is where that opponent's
 * card count and UNO-declared state are already being rendered) — see that
 * component's `onChallengeUno` prop.
 */
export const UnoActionBar: React.FC<UnoActionBarProps> = ({ gameState, currentUserId, onDrawCard, onPlayCard, onDeclareUno }) => {
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const hand = getOwnHand(gameState, currentUserId);
  const hasUnoEligible = hand.length > 0 && hand.length <= 2;
  const hasDeclaredUno = !!gameState.gameSpecificState.unoDeclared?.[currentUserId];
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
  const hasDrawnCard = hand.length > 0;
  const isDrawnCardPlayable = hasDrawnCard && isCardPlayable(hand[hand.length - 1], gameState.gameSpecificState.currentCard, gameState.gameSpecificState.currentColor);

  return (
    <div className="uno-action-bar">
      {isMyTurn ? (
        <>
          {isPlayOrPass ? (
            <>
              {isDrawnCardPlayable && (
                <button
                  onClick={() => onPlayCard(hand.length - 1)}
                  className="btn-primary"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #2a8500 100%)', boxShadow: '0 0 15px rgba(56,176,0,0.4)' }}
                >
                  <Layers size={16} /> Play Drawn Card
                </button>
              )}
              <button
                onClick={onDrawCard}
                className="btn-secondary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Pass Turn <ArrowRightCircle size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onDrawCard}
              className="btn-primary"
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Layers size={16} /> Draw Card
            </button>
          )}
        </>
      ) : (
        <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>Waiting for your turn...</span>
      )}

      {hasUnoEligible && (
        <button
          onClick={onDeclareUno}
          disabled={hasDeclaredUno}
          className="btn-primary"
          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)', boxShadow: '0 0 15px rgba(217,4,41,0.4)' }}
        >
          <Megaphone size={16} /> {hasDeclaredUno ? 'UNO declared' : 'Declare UNO'}
        </button>
      )}
    </div>
  );
};

export default UnoActionBar;
