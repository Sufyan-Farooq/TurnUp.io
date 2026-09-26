import React from 'react';
import { Activity, ArrowRightCircle, Ban, Layers, Palette, RotateCcw, RotateCw, ShieldAlert } from 'lucide-react';
import type { UnoCard, UnoGameStateLike, UnoRoomLike } from './uno.types';
import { getHandCount } from './uno.types';
import './uno.css';

export interface UnoBoardProps {
  gameState: UnoGameStateLike;
  room: UnoRoomLike;
  currentUserId: string;
  onDrawCard: () => void;
  onChallengeUno: (targetPlayerId: string) => void;
  recentLogs?: string[];
  isPreview?: boolean;
  children?: React.ReactNode;
}

const getUnoCardSymbol = (value: string): React.ReactNode => {
  switch (value) {
    case 'skip': return <Ban aria-hidden="true" />;
    case 'reverse': return <RotateCcw aria-hidden="true" />;
    case 'draw2': return '+2';
    case 'wild': return <Palette aria-hidden="true" />;
    case 'wildDraw4': return '+4';
    default: return value;
  }
};

const opponentPosition = (index: number, total: number) => {
  if (total === 1) return 'uno-opponent-seat--top';
  if (total === 2) return index === 0 ? 'uno-opponent-seat--left' : 'uno-opponent-seat--right';
  if (total === 3) return ['uno-opponent-seat--left', 'uno-opponent-seat--top', 'uno-opponent-seat--right'][index];
  if (total === 4) return ['uno-opponent-seat--upper-left', 'uno-opponent-seat--upper-right', 'uno-opponent-seat--left', 'uno-opponent-seat--right'][index];
  return ['uno-opponent-seat--upper-left', 'uno-opponent-seat--top', 'uno-opponent-seat--upper-right', 'uno-opponent-seat--left', 'uno-opponent-seat--right'][index];
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

export const UnoBoard: React.FC<UnoBoardProps> = ({ gameState, room, currentUserId, onDrawCard, onChallengeUno, recentLogs = [], isPreview = false, children }) => {
  const hands = gameState.gameSpecificState.hands || {};
  const otherPlayers = room.players?.filter(player => player.id !== currentUserId) || [];
  const activePlayer = room.players?.find(player => player.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const currentCard = gameState.gameSpecificState.currentCard;
  const currentColor = gameState.gameSpecificState.currentColor;
  const pendingDraw = gameState.gameSpecificState.pendingDrawCount || 0;
  const canStack = gameState.gameSpecificState.rules?.cardStacking !== false;
  const isClockwise = gameState.gameSpecificState.direction !== -1;
  const isPlayOrPass = gameState.subState === 'PLAY_OR_PASS';
  const drawActionLabel = isPlayOrPass ? 'Pass' : pendingDraw > 0 ? `Take +${pendingDraw}` : 'Draw';
  const deckCount = gameState.gameSpecificState.deck === undefined ? null : getHandCount(gameState.gameSpecificState.deck);
  const visibleLogs = recentLogs.filter(line => line.startsWith('UNO:') || line.startsWith('Uno Started!')).slice(-3);

  return (
    <section className={`uno-table uno-table--${currentColor} ${pendingDraw > 0 ? 'has-penalty' : ''}`} aria-label="UNO game table" aria-describedby="uno-turn-status">
      <div className="uno-table-texture" aria-hidden="true" />

      <header className="uno-table-status" id="uno-turn-status" aria-live="polite">
        <span className={`uno-status-light ${isMyTurn ? 'is-active' : ''}`} aria-hidden="true" />
        <div>
          <strong>{isPreview ? 'Waiting for the match' : isMyTurn ? 'Your turn' : `${activePlayer?.name || 'Opponent'} is playing`}</strong>
          <span>{isPreview ? 'The deck and first card appear when the host starts' : pendingDraw > 0 ? `Draw penalty: ${pendingDraw} cards` : isMyTurn ? 'Match a color, number, or action' : 'Watch the discard pile'}</span>
        </div>
        {isPreview ? <span className="uno-direction">Lobby preview</span> : (
          <span className="uno-direction" title={isClockwise ? 'Clockwise play' : 'Counter-clockwise play'}>
            {isClockwise ? <RotateCw aria-hidden="true" /> : <RotateCcw aria-hidden="true" />} {isClockwise ? 'Clockwise' : 'Counter-clockwise'}
          </span>
        )}
      </header>

      {pendingDraw > 0 && (
        <div className="uno-penalty-banner" role="status">
          <span>+</span>{pendingDraw}
          <small>{isMyTurn ? (canStack ? 'Stack a draw card or take the penalty' : 'Take the penalty cards') : 'Penalty is building'}</small>
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
              className={`uno-opponent-seat ${opponentPosition(index, otherPlayers.length)} ${isActive ? 'is-active' : ''} ${isVulnerable && !isPreview ? 'is-vulnerable' : ''}`}
              aria-label={isPreview ? `${player.name}, waiting to play` : `${player.name}, ${cardCount} cards${isActive ? ', current turn' : ''}`}
            >
              <div className="uno-opponent-seat-header">
                <span className={`uno-presence-dot ${player.connected === false ? 'is-offline' : ''}`} aria-hidden="true" />
                <strong className="uno-opponent-name">{player.name}</strong>
                {isActive && <span className="uno-turn-badge">playing</span>}
              </div>
              {!isPreview && <CardBackFan count={cardCount} />}
              <div className="uno-opponent-footer">
                <span className="uno-card-count">{isPreview ? 'Waiting to play' : <><strong>{cardCount}</strong> cards</>}</span>
                {!isPreview && declaredUno && <span className="uno-declared-badge">UNO</span>}
                {!isPreview && isVulnerable && (
                  <button type="button" onClick={() => onChallengeUno(player.id)} aria-label={`Challenge ${player.name}'s missed UNO call`} className="uno-challenge-button">
                    <ShieldAlert aria-hidden="true" /> Challenge
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={`uno-table-center ${isClockwise ? '' : 'is-reversed'} ${isPreview ? 'is-preview' : ''}`}>
        <svg className="uno-direction-ring" viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r="100" />
          <g className="uno-direction-art">
            <path d="M41 47 A100 100 0 0 1 194 74" />
            <path d="M177 62 L199 76 L176 87" className="uno-direction-arrow" />
            <path d="M199 193 A100 100 0 0 1 46 166" />
            <path d="M63 178 L41 164 L64 153" className="uno-direction-arrow" />
          </g>
        </svg>
        {!isPreview && <span key={isClockwise ? 'clockwise' : 'counter-clockwise'} className="uno-direction-center-label" aria-live="polite">
          {isClockwise ? <RotateCw aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
          {isClockwise ? 'Clockwise' : 'Counter-clockwise'}
        </span>}

        <div className="uno-piles">
          <button
            type="button"
            className={`uno-card uno-draw-pile ${isMyTurn && !isPreview ? 'is-actionable' : ''}`}
            onClick={onDrawCard}
            disabled={isPreview || !isMyTurn}
            aria-label={isPreview ? 'Draw pile, available when the match starts' : isMyTurn ? (isPlayOrPass ? 'Pass your turn' : `${drawActionLabel}${deckCount === null ? ', deck count syncing' : `, ${deckCount} cards remain in deck`}`) : 'Draw pile, available on your turn'}
          >
            <span className="uno-card-back-mark">{isPlayOrPass ? <ArrowRightCircle aria-hidden="true" /> : <Layers aria-hidden="true" />}</span>
            <strong>{isPreview ? 'Deck' : drawActionLabel}</strong>
            <small>{isPreview ? 'Not dealt' : isPlayOrPass ? 'end turn' : deckCount === null ? 'syncing count' : `${deckCount} left`}</small>
          </button>

          {currentCard ? (
            <div className={`uno-card uno-discard-card card-${currentCard.color}`} aria-label={`Current card: ${currentColor} ${currentCard.value}`}>
              <span className="uno-card-corner">{currentCard.value.toUpperCase()}</span>
              <span className="uno-card-center-symbol">{getUnoCardSymbol(currentCard.value)}</span>
              <span className="uno-card-corner uno-card-corner--bottom">{currentCard.value.toUpperCase()}</span>
              <span className={`uno-current-color uno-current-color--${currentColor}`}>{currentColor}</span>
            </div>
          ) : (
            <div className="uno-discard-placeholder" role="status" aria-label={isPreview ? 'First card will appear when the match starts' : 'Waiting for the current card'}>
              <Palette aria-hidden="true" />
              <strong>{isPreview ? 'First card' : 'Syncing card'}</strong>
              <small>{isPreview ? 'Revealed at start' : 'Please wait'}</small>
            </div>
          )}
        </div>
      </div>

      <section className="uno-play-feed" aria-label="Recent plays">
        <h2><Activity aria-hidden="true" /> Recent plays</h2>
        {visibleLogs.length === 0 ? (
          <p>{isPreview ? 'Match activity appears here once play begins.' : 'Cards played and turns will appear here.'}</p>
        ) : (
          <ol aria-live="polite" aria-relevant="additions">
            {visibleLogs.map((line, index) => <li key={`${recentLogs.length - visibleLogs.length + index}-${line}`}>{line.replace(/^UNO:\s*/, '')}</li>)}
          </ol>
        )}
      </section>

      {children}
    </section>
  );
};

export { getUnoCardSymbol };
export type { UnoCard };
export default UnoBoard;
