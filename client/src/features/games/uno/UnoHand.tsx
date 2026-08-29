import React, { useEffect, useState } from 'react';
import type { UnoGameStateLike } from './uno.types';
import { getOwnHand, isCardPlayable } from './uno.types';
import { getUnoCardSymbol } from './UnoBoard';

export interface UnoHandProps {
  gameState: UnoGameStateLike;
  currentUserId: string;
  /** Play a single card. `selectedColor` is never passed from here — wild-card
   *  color selection is owned by whichever parent wires up `UnoColorPicker`. */
  onPlayCard: (cardIndex: number, selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  /** Play two identical-value cards at once (only when `rules.cardDoubles` is true). */
  onPlayDoubles: (cardIndices: number[], selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  /** Surfaced instead of calling `alert()` for invalid card-selection attempts. */
  onError: (message: string) => void;
}

/**
 * The current player's own hand. Only the current user's full hand is ever
 * rendered here — other players' hands are server-redacted to a count and are
 * rendered by `UnoBoard` as card-backs instead.
 *
 * Supports both tap-to-select-then-play (for doubles, when `rules.cardDoubles`
 * is enabled) and legacy single-tap-to-play (when doubles are disabled).
 */
export const UnoHand: React.FC<UnoHandProps> = ({ gameState, currentUserId, onPlayCard, onPlayDoubles, onError }) => {
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);

  const hand = getOwnHand(gameState, currentUserId);
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const rules = gameState.gameSpecificState.rules || { cardStacking: true, cardDoubles: true };
  const pendingDraw = gameState.gameSpecificState.pendingDrawCount || 0;
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';

  // Selection is transient UI state — clear it whenever the turn/substate changes
  // or the hand size changes (a card was played/drawn), mirroring the explicit
  // `setSelectedCardIndices([])` calls the original App.tsx made after every
  // DRAW_CARD / PLAY_CARD socket emit.
  useEffect(() => {
    setSelectedCardIndices([]);
  }, [gameState.activePlayerId, gameState.subState, hand.length]);

  return (
    <div className="uno-hand-wrap">
      {/* Doubles Floating Action Overlay Bar */}
      {selectedCardIndices.length > 0 && (
        <div className="glass-panel uno-selection-bar">
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
            {selectedCardIndices.length} Card{selectedCardIndices.length > 1 ? 's' : ''} Selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedCardIndices.length === 1 && (
              <button
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px' }}
                onClick={() => onPlayCard(selectedCardIndices[0])}
              >
                Play Single
              </button>
            )}
            {selectedCardIndices.length === 2 && (
              <button
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-orange) 100%)', boxShadow: '0 0 10px rgba(255, 183, 3, 0.4)' }}
                onClick={() => onPlayDoubles(selectedCardIndices)}
              >
                Play Double!
              </button>
            )}
            <button
              className="btn-secondary"
              style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '12px' }}
              onClick={() => setSelectedCardIndices([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actual Hand of Cards */}
      <div className="uno-hand-row">
        {hand.map((card, idx) => {
          const isDrawnCard = idx === hand.length - 1;
          const isSelected = selectedCardIndices.includes(idx);

          // Validation for single card selection eligibility
          let playable = isMyTurn &&
            (!isPlayOrPass || isDrawnCard) &&
            isCardPlayable(card, gameState.gameSpecificState.currentCard, gameState.gameSpecificState.currentColor);

          // Under draw penalty, we can stack if stacking rule is enabled and the card is draw2 or wildDraw4
          if (pendingDraw > 0) {
            if (rules.cardStacking) {
              const currentVal = gameState.gameSpecificState.currentCard?.value;
              playable = isMyTurn && (
                (currentVal === 'draw2' && (card.value === 'draw2' || card.value === 'wildDraw4')) ||
                (currentVal === 'wildDraw4' && card.value === 'wildDraw4')
              );
            } else {
              playable = false;
            }
          }

          return (
            <div
              key={idx}
              className={`uno-card card-${card.color}`}
              style={{
                borderWidth: (isPlayOrPass && isDrawnCard) ? '4px' : (playable || isSelected) ? '3.5px' : '2.5px',
                borderColor: (isPlayOrPass && isDrawnCard) ? 'var(--accent-gold)' : isSelected ? 'var(--accent-gold)' : playable ? '#fff' : undefined,
                boxShadow: (isPlayOrPass && isDrawnCard)
                  ? '0 0 20px var(--accent-gold), 0 5px 15px rgba(0,0,0,0.3)'
                  : isSelected
                    ? '0 0 25px var(--accent-gold), 0 5px 15px rgba(0,0,0,0.4)'
                    : playable
                      ? '0 0 15px rgba(255, 255, 255, 0.4), 0 5px 15px rgba(0,0,0,0.3)'
                      : undefined,
                transform: isSelected
                  ? 'translateY(-30px) scale(1.05)'
                  : (isPlayOrPass && isDrawnCard) || playable
                    ? 'translateY(-15px)'
                    : undefined,
                opacity: (selectedCardIndices.length > 0 && !isSelected) ? 0.6 : 1,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onClick={() => {
                if (!isMyTurn) return;

                if (pendingDraw > 0 && !playable) {
                  onError('You must stack a +2/+4 or draw penalty cards!');
                  return;
                }
                if (isPlayOrPass && !isDrawnCard) {
                  onError('You can only play the drawn card or pass!');
                  return;
                }

                // If doubles rule is enabled, manage multi-selection (tap-to-select-then-play)
                if (rules.cardDoubles && !isPlayOrPass) {
                  if (isSelected) {
                    setSelectedCardIndices(prev => prev.filter(x => x !== idx));
                  } else if (selectedCardIndices.length === 0) {
                    setSelectedCardIndices([idx]);
                  } else if (selectedCardIndices.length === 1) {
                    const firstCard = hand[selectedCardIndices[0]];
                    if (firstCard.value === card.value) {
                      setSelectedCardIndices([selectedCardIndices[0], idx]);
                    } else {
                      // If value does not match, switch selection to this card
                      setSelectedCardIndices([idx]);
                    }
                  } else {
                    // Max 2 cards, reset selection to new card
                    setSelectedCardIndices([idx]);
                  }
                } else {
                  // Legacy single-tap instant play (if playable)
                  if (playable) {
                    onPlayCard(idx);
                  } else {
                    onError('This card is not playable right now!');
                  }
                }
              }}
            >
              {isPlayOrPass && isDrawnCard && (
                <div className="uno-drawn-badge">DRAWN</div>
              )}
              <div style={{ alignSelf: 'flex-start', fontSize: '14px' }}>
                {card.value.toUpperCase()}
              </div>
              <div className="uno-card-center-symbol">
                {getUnoCardSymbol(card.value)}
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: '14px', transform: 'rotate(180deg)' }}>
                {card.value.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnoHand;
