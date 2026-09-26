import React from 'react';
import { ArrowRightCircle, Layers, Megaphone } from 'lucide-react';
import type { UnoGameStateLike } from './uno.types';
import { getOwnHand, isCardPlayable } from './uno.types';

export interface UnoActionBarProps {
  gameState: UnoGameStateLike;
  currentUserId: string;
  isPreview?: boolean;
  onDrawCard: () => void;
  onPlayCard: (cardIndex: number, selectedColor?: 'red' | 'green' | 'blue' | 'yellow') => void;
  onDeclareUno: () => void;
}

export const UnoActionBar: React.FC<UnoActionBarProps> = ({ gameState, currentUserId, isPreview = false, onDrawCard, onPlayCard, onDeclareUno }) => {
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const hand = getOwnHand(gameState, currentUserId);
  const canDeclareUno = hand.length > 0 && hand.length <= 2;
  const hasDeclaredUno = !!gameState.gameSpecificState.unoDeclared?.[currentUserId];
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
  const drawnCardIndex = hand.length - 1;
  const drawnCardPlayable = drawnCardIndex >= 0 && isCardPlayable(hand[drawnCardIndex], gameState.gameSpecificState.currentCard, gameState.gameSpecificState.currentColor);

  return (
    <div className={`uno-action-bar ${isMyTurn ? 'is-active' : ''}`} aria-live="polite">
      <div className="uno-action-context">
        <span className="uno-action-kicker">{isPreview ? 'Lobby status' : isMyTurn ? 'Make your move' : 'Table status'}</span>
        <strong>{isPreview ? 'Waiting for host to start' : isMyTurn ? (isPlayOrPass ? 'Play the drawn card or pass' : 'Choose a card or draw') : 'Waiting for your turn'}</strong>
      </div>
      <div className="uno-action-buttons">
        {!isPreview && isMyTurn && isPlayOrPass && drawnCardPlayable && (
          <button type="button" onClick={() => onPlayCard(drawnCardIndex)} className="uno-action-button uno-action-button--play">
            <Layers aria-hidden="true" /> Play drawn card
          </button>
        )}
        {!isPreview && isMyTurn && (
          <button type="button" onClick={onDrawCard} className={`uno-action-button ${isPlayOrPass ? 'uno-action-button--secondary' : 'uno-action-button--draw'}`}>
            {isPlayOrPass ? <ArrowRightCircle aria-hidden="true" /> : <Layers aria-hidden="true" />}
            {isPlayOrPass ? 'Pass turn' : 'Draw card'}
          </button>
        )}
        {!isPreview && canDeclareUno && (
          <button type="button" onClick={onDeclareUno} disabled={hasDeclaredUno} className="uno-action-button uno-action-button--uno">
            <Megaphone aria-hidden="true" /> {hasDeclaredUno ? 'UNO declared' : 'Call UNO'}
          </button>
        )}
      </div>
    </div>
  );
};

export default UnoActionBar;
