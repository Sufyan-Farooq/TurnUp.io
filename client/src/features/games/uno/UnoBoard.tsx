import React from 'react';
import { ArrowRightCircle, Ban, Layers, Palette, RefreshCw, ShieldAlert } from 'lucide-react';
import type { UnoCard, UnoGameStateLike, UnoRoomLike } from './uno.types';
import { getHandCount } from './uno.types';
import './uno.css';

export interface UnoBoardProps {
  gameState: UnoGameStateLike;
  room: UnoRoomLike;
  currentUserId: string;
  onDrawCard: () => void;
  onChallengeUno: (targetPlayerId: string) => void;
  children?: React.ReactNode;
}

const getUnoCardSymbol = (value: string): React.ReactNode => {
  switch (value) {
    case 'skip': return <Ban aria-hidden="true" />;
    case 'reverse': return <RefreshCw aria-hidden="true" />;
    case 'draw2': return '+2';
    case 'wild': return <Palette aria-hidden="true" />;
    case 'wildDraw4': return '+4';
    default: return value;
  }
};

const opponentPosition = (index: number, total: number) => {
  if (total === 1) return 'uno-opponent-seat--top';
  if (total === 2) return index === 0 ? 'uno-opponent-seat--left' : 'uno-opponent-seat--right';
  return ['uno-opponent-seat--left', 'uno-opponent-seat--top', 'uno-opponent-seat--right'][index] || 'uno-opponent-seat--top';
};

const CardBackFan: React.FC<{ count: number }> = ({ count }) => {
  const visible = Math.min(count, 7);
  return (
    <div className="uno-card-back-fan" aria-hidden="true">
      {Array.from({ length: visible }, (_, index) => {
        const centeredIndex = index - (visible - 1) / 2;
        return (
          <span
            key={index}
            className="uno-card-back-mini"
            style={{ '--fan-offset': `${centeredIndex * 13}px`, '--fan-rotation': `${centeredIndex * 4}deg` } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export const UnoBoard: React.FC<UnoBoardProps> = ({ gameState, room, currentUserId, onDrawCard, onChallengeUno, children }) => {
  const hands = gameState.gameSpecificState.hands || {};
  const otherPlayers = room.players?.filter(player => player.id !== currentUserId) || [];
  const activePlayer = room.players?.find(player => player.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const currentCard = gameState.gameSpecificState.currentCard;
  const currentColor = gameState.gameSpecificState.currentColor;
  const pendingDraw = gameState.gameSpecificState.pendingDrawCount || 0;
  const isClockwise = gameState.gameSpecificState.direction === 1;
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
  const drawActionLabel = isPlayOrPass ? 'Pass' : pendingDraw > 0 ? `Take +${pendingDraw}` : 'Draw';

  return (
    <section className={`uno-table uno-table--${currentColor} ${pendingDraw > 0 ? 'has-penalty' : ''}`} aria-label="UNO game table" aria-describedby="uno-turn-status">
      <div className="uno-table-texture" aria-hidden="true" />

      <header className="uno-table-status" id="uno-turn-status" aria-live="polite">
        <span className={`uno-status-light ${isMyTurn ? 'is-active' : ''}`} aria-hidden="true" />
        <div>
          <strong>{isMyTurn ? 'Your turn' : `${activePlayer?.name || 'Opponent'} is playing`}</strong>
          <span>{pendingDraw > 0 ? `Draw penalty: ${pendingDraw} cards` : isMyTurn ? 'Match a color, number, or action' : 'Watch the discard pile'}</span>
        </div>
        <span className="uno-direction" title={isClockwise ? 'Clockwise play' : 'Counter-clockwise play'}>
          <RefreshCw aria-hidden="true" /> {isClockwise ? 'Clockwise' : 'Counter-clockwise'}
        </span>
      </header>

      {pendingDraw > 0 && (
        <div className="uno-penalty-banner" role="status">
          <span>+</span>{pendingDraw}
          <small>{isMyTurn ? 'Stack a draw card or take the penalty' : 'Penalty is building'}</small>
        </div>
      )}

      <div className="uno-opponents" aria-label="Opponents">
        {otherPlayers.map((player, index) => {
          const cardCount = getHandCount(hands[player.id]);
          const declaredUno = !!gameState.gameSpecificState.unoDeclared?.[player.id];
          const isVulnerable = cardCount === 1 && !declaredUno;
          const isActive = player.id === gameState.activePlayerId;

          return (
            <article
              key={player.id}
              className={`uno-opponent-seat ${opponentPosition(index, otherPlayers.length)} ${isActive ? 'is-active' : ''} ${isVulnerable ? 'is-vulnerable' : ''}`}
              aria-label={`${player.name}, ${cardCount} cards${isActive ? ', current turn' : ''}`}
            >
              <div className="uno-opponent-seat-header">
                <span className={`uno-presence-dot ${player.connected === false ? 'is-offline' : ''}`} aria-hidden="true" />
                <strong className="uno-opponent-name">{player.name}</strong>
                {isActive && <span className="uno-turn-badge">playing</span>}
              </div>
              <CardBackFan count={cardCount} />
              <div className="uno-opponent-footer">
                <span className="uno-card-count"><strong>{cardCount}</strong> cards</span>
                {declaredUno && <span className="uno-declared-badge">UNO</span>}
                {isVulnerable && (
                  <button type="button" onClick={() => onChallengeUno(player.id)} aria-label={`Challenge ${player.name}'s missed UNO call`} className="uno-challenge-button">
                    <ShieldAlert aria-hidden="true" /> Challenge
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={`uno-table-center ${isClockwise ? '' : 'is-reversed'}`}>
        <svg className="uno-direction-ring" viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r="100" />
          <path d="M52 47 A100 100 0 0 1 205 74" />
          <path d="M188 62 L210 76 L187 87" className="uno-direction-arrow" />
          <path d="M188 193 A100 100 0 0 1 35 166" />
          <path d="M52 178 L30 164 L53 153" className="uno-direction-arrow" />
        </svg>

        <div className="uno-piles">
          <button
            type="button"
            className={`uno-card uno-draw-pile ${isMyTurn ? 'is-actionable' : ''}`}
            onClick={onDrawCard}
            disabled={!isMyTurn}
            aria-label={isMyTurn ? (isPlayOrPass ? 'Pass your turn' : `${drawActionLabel}, ${getHandCount(gameState.gameSpecificState.deck)} cards remain`) : 'Draw pile, available on your turn'}
          >
            <span className="uno-card-back-mark">{isPlayOrPass ? <ArrowRightCircle aria-hidden="true" /> : <Layers aria-hidden="true" />}</span>
            <strong>{drawActionLabel}</strong>
            <small>{isPlayOrPass ? 'end turn' : `${getHandCount(gameState.gameSpecificState.deck)} left`}</small>
          </button>

          {currentCard && (
            <div className={`uno-card uno-discard-card card-${currentCard.color}`} aria-label={`Current card: ${currentColor} ${currentCard.value}`}>
              <span className="uno-card-corner">{currentCard.value.toUpperCase()}</span>
              <span className="uno-card-center-symbol">{getUnoCardSymbol(currentCard.value)}</span>
              <span className="uno-card-corner uno-card-corner--bottom">{currentCard.value.toUpperCase()}</span>
              <span className={`uno-current-color uno-current-color--${currentColor}`}>{currentColor}</span>
            </div>
          )}
        </div>
      </div>

      {children}
    </section>
  );
};

export { getUnoCardSymbol };
export type { UnoCard };
export default UnoBoard;
