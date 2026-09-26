import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import type { UnoGameStateLike } from './uno.types';
import { getOwnHand, isCardPlayable } from './uno.types';
import { getUnoCardSymbol, getUnoCardCornerText } from './UnoBoard';

export interface UnoHandProps {
  gameState: UnoGameStateLike;
  currentUserId: string;
  isPreview?: boolean;
  /** Play a single card. `selectedColor` is never passed from here — wild-card
   *  color selection is owned by whichever parent wires up `UnoColorPicker`. */
  onPlayCard: (cardIndex: number, selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  /** Play two identical-value cards at once (only when `rules.cardDoubles` is true). */
  onPlayDoubles: (cardIndices: number[], selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  /** Declare UNO when having 1 or 2 cards. */
  onDeclareUno?: () => void;
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
export const UnoHand: React.FC<UnoHandProps> = ({ gameState, currentUserId, isPreview = false, onPlayCard, onPlayDoubles, onDeclareUno, onError }) => {
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);

  const hand = getOwnHand(gameState, currentUserId);
  const handIsAvailable = Array.isArray(gameState.gameSpecificState.hands?.[currentUserId]);
  const handSignature = hand.map(card => `${card.color}:${card.value}`).join('|');
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const rules = gameState.gameSpecificState.rules || { cardStacking: true, cardDoubles: true };
  const pendingDraw = gameState.gameSpecificState.pendingDrawCount || 0;
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
  const canDeclareUno = hand.length > 0 && hand.length <= 2;
  const hasDeclaredUno = !!gameState.gameSpecificState.unoDeclared?.[currentUserId];

  const isPlayableNow = (cardIndex: number) => {
    const card = hand[cardIndex];
    if (!card || !isMyTurn) return false;
    if (isPlayOrPass && cardIndex !== hand.length - 1) return false;
    if (pendingDraw > 0) {
      if (!rules.cardStacking) return false;
      const currentValue = gameState.gameSpecificState.currentCard?.value;
      return (currentValue === 'draw2' && (card.value === 'draw2' || card.value === 'wildDraw4'))
        || (currentValue === 'wildDraw4' && card.value === 'wildDraw4');
    }
    return isCardPlayable(card, gameState.gameSpecificState.currentCard, gameState.gameSpecificState.currentColor);
  };

  const selectedCardsCanPlay = selectedCardIndices.length === 1
    ? isPlayableNow(selectedCardIndices[0])
    : selectedCardIndices.length === 2
      && selectedCardIndices.some(isPlayableNow)
      && hand[selectedCardIndices[0]]?.value === hand[selectedCardIndices[1]]?.value;

  useEffect(() => {
    setSelectedCardIndices([]);
  }, [gameState.activePlayerId, gameState.subState, handSignature]);

  return (
    <div className="uno-hand-wrap">
      <div className="uno-hand-heading">
        <div className="uno-hand-heading-left">
          <span className="uno-hand-kicker">Your hand</span>
          <strong>{isPreview ? 'Not dealt' : `${hand.length} card${hand.length === 1 ? '' : 's'}`}</strong>
        </div>

        {!isPreview && canDeclareUno && onDeclareUno && (
          <button
            type="button"
            className={`uno-hand-callout-btn ${hasDeclaredUno ? 'is-declared' : 'is-urgent'}`}
            onClick={hasDeclaredUno ? undefined : onDeclareUno}
            disabled={hasDeclaredUno}
            aria-label={hasDeclaredUno ? 'UNO already declared' : 'Call UNO now'}
          >
            <Megaphone size={15} strokeWidth={2.5} />
            <span>{hasDeclaredUno ? 'UNO DECLARED ✓' : 'CALL UNO!'}</span>
          </button>
        )}

        <span className="uno-hand-hint">
          {isPreview ? 'Cards are dealt when the match starts' : isMyTurn ? (rules.cardDoubles ? 'Select one card, or pair matching values' : 'Choose a highlighted card') : 'Cards unlock on your turn'}
        </span>
      </div>

      {selectedCardIndices.length > 0 && (
        <div className="uno-selection-bar" role="status" aria-live="polite">
          <span><strong>{selectedCardIndices.length}</strong> card{selectedCardIndices.length > 1 ? 's' : ''} selected</span>
          <div className="uno-selection-actions">
            {selectedCardIndices.length === 1 && (
              <button type="button" className="uno-selection-play" disabled={!selectedCardsCanPlay} onClick={() => onPlayCard(selectedCardIndices[0])}>
                Play card
              </button>
            )}
            {selectedCardIndices.length === 2 && (
              <button type="button" className="uno-selection-play" disabled={!selectedCardsCanPlay} onClick={() => onPlayDoubles(selectedCardIndices)}>
                Play pair
              </button>
            )}
            <button type="button" className="uno-selection-cancel" onClick={() => setSelectedCardIndices([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      {!isPreview && isMyTurn && pendingDraw > 0 && (
        <div className="uno-hand-penalty-alert" role="alert">
          <div className="uno-hand-penalty-pill">
            <span className="uno-hand-penalty-plus">+</span>
            <span className="uno-hand-penalty-num">{pendingDraw}</span>
          </div>
          <div className="uno-hand-penalty-content">
            <span className="uno-hand-penalty-title">Draw Penalty Active On You</span>
            <span className="uno-hand-penalty-sub">
              {rules.cardStacking
                ? `Play a matching draw card (+2 or +4) to stack, or click Draw pile to take ${pendingDraw} cards`
                : `Card stacking is disabled. Click Draw pile to take ${pendingDraw} cards`}
            </span>
          </div>
        </div>
      )}

      <div className="uno-hand-row" role="group" aria-label="Your UNO cards">
        {isPreview && <span className="uno-hand-empty">Your cards will appear here.</span>}
        {!isPreview && hand.length === 0 && <span className="uno-hand-empty">{handIsAvailable ? 'No cards in your hand. Waiting for the table to resolve the result.' : 'Syncing your hand…'}</span>}
        {hand.map((card, idx) => {
          const isDrawnCard = idx === hand.length - 1;
          const isSelected = selectedCardIndices.includes(idx);
          const playable = isPlayableNow(idx);

          const handleCardInteraction = () => {
            if (!isMyTurn) return;

            if (pendingDraw > 0 && !playable) {
              onError(rules.cardStacking
                ? 'Stack a compatible draw card or take the penalty.'
                : 'Card stacking is off. Draw the penalty cards.');
              return;
            }
            if (isPlayOrPass && !isDrawnCard) {
              onError('Only the card you just drew can be played now.');
              return;
            }

            if (rules.cardDoubles && !isPlayOrPass) {
              if (isSelected) {
                setSelectedCardIndices(prev => prev.filter(x => x !== idx));
              } else if (selectedCardIndices.length === 0) {
                setSelectedCardIndices([idx]);
              } else if (selectedCardIndices.length === 1) {
                const firstCard = hand[selectedCardIndices[0]];
                setSelectedCardIndices(firstCard?.value === card.value
                  ? [selectedCardIndices[0], idx]
                  : [idx]);
              } else {
                setSelectedCardIndices([idx]);
              }
            } else if (playable) {
              onPlayCard(idx);
            } else {
              onError('This card does not match the color or value.');
            }
          };

          return (
            <button
              type="button"
              key={idx}
              className={`uno-card uno-hand-card card-${card.color} ${playable ? 'is-playable' : ''} ${isSelected ? 'is-selected' : ''} ${isPlayOrPass && isDrawnCard ? 'is-drawn' : ''} ${selectedCardIndices.length > 0 && !isSelected ? 'is-deemphasized' : ''}`}
              tabIndex={isMyTurn ? 0 : -1}
              aria-label={`${card.color} ${card.value}${playable ? ', playable' : ', not playable'}`}
              aria-pressed={isSelected}
              onClick={handleCardInteraction}
            >
              {isPlayOrPass && isDrawnCard && (
                <span className="uno-drawn-badge">drawn</span>
              )}
              {playable && <span className="uno-playable-label">playable</span>}
              <span className="uno-card-corner">{getUnoCardCornerText(card.value)}</span>
              <span className="uno-card-center-symbol">{getUnoCardSymbol(card.value)}</span>
              <span className="uno-card-corner uno-card-corner--bottom">{getUnoCardCornerText(card.value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UnoHand;
