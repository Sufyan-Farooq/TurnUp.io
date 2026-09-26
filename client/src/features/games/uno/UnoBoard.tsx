import React from 'react';
import { Activity, ArrowRightCircle, Ban, Palette, RotateCcw, RotateCw, ShieldAlert } from 'lucide-react';
import type { UnoCard, UnoGameStateLike, UnoRoomLike } from './uno.types';
import { getHandCount } from './uno.types';
import './uno.css';

import type { VoteKickState } from '../../room/types';

export interface UnoBoardProps {
  gameState: UnoGameStateLike;
  room: UnoRoomLike;
  currentUserId: string;
  onDrawCard: () => void;
  onChallengeUno: (targetPlayerId: string) => void;
  recentLogs?: string[];
  isPreview?: boolean;
  children?: React.ReactNode;
  voteKickState?: VoteKickState | null;
  voteKickCountdown?: number;
  onOpenVoteKickPanel?: () => void;
}

const getUnoCardCornerText = (value: string): string => {
  switch (value) {
    case 'wildDraw4': return '+4';
    case 'draw2': return '+2';
    case 'skip': return '⊘';
    case 'reverse': return '⇄';
    case 'wild': return '★';
    default: return value.toUpperCase();
  }
};

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

export const UnoBoard: React.FC<UnoBoardProps> = ({
  gameState,
  room,
  currentUserId,
  onDrawCard,
  onChallengeUno,
  recentLogs = [],
  isPreview = false,
  children,
  voteKickState,
  voteKickCountdown,
  onOpenVoteKickPanel,
}) => {
  const hands = gameState.gameSpecificState.hands || {};
  const otherPlayers = room.players?.filter(player => player.id !== currentUserId) || [];
  const activePlayer = room.players?.find(player => player.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const targetPlayerId = voteKickState?.targetPlayerId;
  const yesCount = voteKickState ? Object.values(voteKickState.votes || {}).filter(v => v === true).length : 0;
  const requiredVotes = voteKickState?.requiredVotes ?? 0;
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
          <strong>{isPreview ? 'Waiting for the match' : isMyTurn ? (pendingDraw > 0 ? `You face a +${pendingDraw} draw penalty!` : 'Your turn') : (pendingDraw > 0 ? `${activePlayer?.name || 'Opponent'} faces +${pendingDraw} penalty` : `${activePlayer?.name || 'Opponent'} is playing`)}</strong>
          <span>{isPreview ? 'The deck and first card appear when the host starts' : pendingDraw > 0 ? (isMyTurn ? (canStack ? 'Stack a compatible draw card or draw the penalty' : `Draw ${pendingDraw} penalty cards`) : `${activePlayer?.name || 'Opponent'} must stack or draw ${pendingDraw} cards`) : isMyTurn ? 'Match a color, number, or action' : 'Watch the discard pile'}</span>
        </div>
        {isPreview ? <span className="uno-direction">Lobby preview</span> : (
          <span className="uno-direction" title={isClockwise ? 'Clockwise play' : 'Counter-clockwise play'}>
            {isClockwise ? <RotateCw aria-hidden="true" /> : <RotateCcw aria-hidden="true" />} {isClockwise ? 'Clockwise' : 'Counter-clockwise'}
          </span>
        )}
      </header>

      <div className="uno-opponents" aria-label="Opponents">
        {otherPlayers.map((player, index) => {
          const cardCount = getHandCount(hands[player.id]);
          const declaredUno = !!gameState.gameSpecificState.unoDeclared?.[player.id];
          const isVulnerable = cardCount === 1 && !declaredUno;
          const isActive = player.id === gameState.activePlayerId;
          const hasPenalty = isActive && pendingDraw > 0;

          const isVoteKickTarget = targetPlayerId === player.id;

          return (
            <article
              key={player.id}
              className={`uno-opponent-seat ${opponentPosition(index, otherPlayers.length)} ${isActive ? 'is-active' : ''} ${hasPenalty ? 'has-penalty' : ''} ${isVulnerable && !isPreview ? 'is-vulnerable' : ''} ${isVoteKickTarget ? 'is-votekick-target' : ''}`}
              aria-label={isPreview ? `${player.name}, waiting to play` : `${player.name}, ${cardCount} cards${isActive ? ', current turn' : ''}${hasPenalty ? `, facing +${pendingDraw} draw penalty` : ''}`}
            >
              {hasPenalty && !isPreview && (
                <div className="uno-seat-penalty-tag" role="status" aria-label={`${player.name} faces +${pendingDraw} draw penalty`}>
                  <span className="uno-seat-penalty-num">+{pendingDraw}</span>
                  <span className="uno-seat-penalty-label">{canStack ? 'Stack or Take' : 'Penalty'}</span>
                </div>
              )}
              <div className="uno-opponent-seat-header">
                <span className={`uno-presence-dot ${player.connected === false ? 'is-offline' : ''}`} aria-hidden="true" />
                <strong className="uno-opponent-name">{player.name}</strong>
                {isVoteKickTarget ? (
                  <button
                    type="button"
                    onClick={onOpenVoteKickPanel}
                    className="uno-votekick-badge"
                    title="Vote kick in progress. Click to view details"
                  >
                    <Ban size={10} />
                    <span>Kick: {yesCount}/{requiredVotes}</span>
                    {voteKickCountdown !== undefined && <span>({voteKickCountdown}s)</span>}
                  </button>
                ) : hasPenalty && !isPreview ? (
                  <span className="uno-seat-penalty-badge">+{pendingDraw} PENALTY</span>
                ) : isActive ? (
                  <span className="uno-turn-badge">playing</span>
                ) : null}
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
        <svg className="uno-direction-ring" viewBox="0 0 400 400" aria-hidden="true">
          <ellipse cx="200" cy="200" rx="168" ry="132" />
          <g className="uno-direction-art">
            {/* Top arc & arrow: sweeps left to right */}
            <path d="M 45 168 A 168 132 0 0 1 355 168" />
            <polygon points="360,178 362,154 344,166" className="uno-direction-arrow" />
            {/* Bottom arc & arrow: sweeps right to left */}
            <path d="M 355 232 A 168 132 0 0 1 45 232" />
            <polygon points="40,222 38,246 56,234" className="uno-direction-arrow" />
          </g>
        </svg>

        <div className="uno-piles">
          <button
            type="button"
            className={`uno-card uno-draw-pile ${isMyTurn && !isPreview ? 'is-actionable' : ''} ${isPlayOrPass ? 'is-pass-action' : ''} ${isMyTurn && pendingDraw > 0 ? 'has-penalty-action' : ''}`}
            onClick={onDrawCard}
            disabled={isPreview || !isMyTurn}
            aria-label={isPreview ? 'Draw pile, available when the match starts' : isMyTurn ? (isPlayOrPass ? 'Pass your turn' : `${drawActionLabel}${deckCount === null ? ', deck count syncing' : `, ${deckCount} cards remain in deck`}`) : 'Draw pile, available on your turn'}
          >
            {isPlayOrPass ? (
              <div className="uno-card-pass-symbol" aria-hidden="true">
                <ArrowRightCircle size={28} />
              </div>
            ) : (
              <div className="uno-card-back-badge" aria-hidden="true">
                <span className="uno-card-back-text">UNO</span>
              </div>
            )}
            <strong className="uno-draw-pile-action">{isPreview ? 'Deck' : drawActionLabel}</strong>
            <small className="uno-draw-pile-count">{isPreview ? 'Not dealt' : isPlayOrPass ? 'End turn' : deckCount === null ? 'Syncing' : `${deckCount} left`}</small>
          </button>

          {currentCard ? (
            <div className={`uno-card uno-discard-card card-${currentCard.color}`} aria-label={`Current card: ${currentColor} ${currentCard.value}`}>
              <span className="uno-card-corner">{getUnoCardCornerText(currentCard.value)}</span>
              <span className="uno-card-center-symbol">{getUnoCardSymbol(currentCard.value)}</span>
              <span className="uno-card-corner uno-card-corner--bottom">{getUnoCardCornerText(currentCard.value)}</span>
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

export { getUnoCardSymbol, getUnoCardCornerText };
export type { UnoCard };
export default UnoBoard;
