import React from 'react';
import { Ban, Layers, Palette, RefreshCw, ShieldAlert } from 'lucide-react';
import type { UnoCard, UnoGameStateLike, UnoRoomLike } from './uno.types';
import { getHandCount } from './uno.types';

export interface UnoBoardProps {
  gameState: UnoGameStateLike;
  room: UnoRoomLike;
  currentUserId: string;
  /** Draw pile click handler (also used for "draw" during your turn). */
  onDrawCard: () => void;
  /** Challenge an opponent's (possibly false) UNO status. Out-of-turn action. */
  onChallengeUno: (targetPlayerId: string) => void;
  /**
   * Rendered after the center table pile, inside the same `.uno-table` container —
   * intended for `<UnoHand />` so the original DOM layout (opponents, center pile,
   * then the current player's hand all inside one `.uno-table`) is preserved.
   */
  children?: React.ReactNode;
}

const getUnoCardSymbol = (value: string): React.ReactNode => {
  switch (value) {
    case 'skip': return <Ban size={22} aria-label="Skip" />;
    case 'reverse': return <RefreshCw size={22} aria-label="Reverse" />;
    case 'draw2': return '+2';
    case 'wild': return <Palette size={22} aria-label="Wild" />;
    case 'wildDraw4': return '+4';
    default: return value;
  }
};

const getOpponentStyle = (idx: number, total: number): React.CSSProperties => {
  if (total === 3) {
    if (idx === 0) return { position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 100 };
    if (idx === 1) return { position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 };
    if (idx === 2) return { position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 100 };
  }
  if (total === 2) {
    if (idx === 0) return { position: 'absolute', left: '48px', top: '40%', transform: 'translateY(-50%)', zIndex: 100 };
    if (idx === 1) return { position: 'absolute', right: '48px', top: '40%', transform: 'translateY(-50%)', zIndex: 100 };
  }
  return { position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 };
};

const renderCardBackFan = (count: number, isVertical: boolean = false) => {
  const maxVisible = Math.min(count, 8);
  const cards: React.ReactNode[] = [];
  for (let i = 0; i < maxVisible; i++) {
    const rotation = (i - (maxVisible - 1) / 2) * 8;
    const offset = (i - (maxVisible - 1) / 2) * 12;
    cards.push(
      <div
        key={i}
        className="uno-card-back-mini"
        style={{
          width: '28px',
          height: '42px',
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #d90429 0%, #7a0010 100%)',
          border: '1.5px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          transform: isVertical
            ? `translateY(${offset}px) rotate(${90 + rotation}deg)`
            : `translateX(${offset}px) rotate(${rotation}deg)`,
          position: i === 0 ? 'relative' : 'absolute',
          transition: 'all 0.2s ease',
        }}
      />
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '42px', width: isVertical ? '42px' : `${28 + (maxVisible - 1) * 12}px` }}>
      {cards}
    </div>
  );
};

/**
 * Uno table: opponent seats (card-back fan + count, fog-of-war respected — only
 * counts are ever shown for other players) + center pile (draw pile / discard
 * pile / current color indicator + turn-direction indicator).
 */
export const UnoBoard: React.FC<UnoBoardProps> = ({ gameState, room, currentUserId, onDrawCard, onChallengeUno, children }) => {
  const hands = gameState.gameSpecificState.hands || {};
  const otherPlayers = room.players?.filter(p => p.id !== currentUserId) || [];
  const isMyTurn = gameState.activePlayerId === currentUserId;

  const deckCount = gameState.gameSpecificState.deck;
  const currentCard = gameState.gameSpecificState.currentCard;
  const currentColor = gameState.gameSpecificState.currentColor;
  const direction = gameState.gameSpecificState.direction;
  const isClockwise = direction === 1;

  return (
    <div className="uno-table">
      {/* Opponents positioned around the board */}
      {otherPlayers.map((p, idx) => {
        const cardCount = getHandCount(hands[p.id]);
        const isVulnerable = cardCount === 1 && !gameState.gameSpecificState.unoDeclared?.[p.id];
        const isPlayerActive = p.id === gameState.activePlayerId;

        return (
          <div
            key={p.id}
            className="glass-panel uno-opponent-seat"
            style={{
              ...getOpponentStyle(idx, otherPlayers.length),
              borderColor: isPlayerActive ? 'var(--accent-green)' : 'rgba(123, 44, 191, 0.2)',
              boxShadow: isPlayerActive ? '0 0 15px var(--accent-green)' : undefined,
              background: isPlayerActive ? 'rgba(56, 176, 0, 0.08)' : 'rgba(27, 18, 50, 0.8)',
            }}
          >
            <div className="uno-opponent-seat-header">
              <div className="uno-opponent-name">
                <div className="uno-presence-dot" style={{ backgroundColor: p.connected ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: '#fff' }}>{p.name}</span>
              </div>
              {isPlayerActive && <span className="uno-turn-badge">TURN</span>}
            </div>

            {/* Opponent Card Fan (Vertical for left/right, horizontal for top). Only the
                count is ever known client-side — the server never sends other players'
                actual cards (fog-of-war), so these are always rendered as card-backs. */}
            {renderCardBackFan(cardCount, otherPlayers.length === 3 ? (idx === 0 || idx === 2) : true)}

            <div className="uno-opponent-footer">
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cardCount} cards</span>
              {cardCount === 1 && (
                <span className="badge-uno" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                  UNO!
                </span>
              )}
              <button
                onClick={() => onChallengeUno(p.id)}
                className="btn-secondary"
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  borderRadius: '4px',
                  height: 'fit-content',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderColor: isVulnerable ? 'var(--accent-pink)' : undefined,
                  boxShadow: isVulnerable ? '0 0 10px var(--accent-pink)' : undefined
                }}
              >
                <ShieldAlert size={11} /> Challenge
              </button>
            </div>
          </div>
        );
      })}

      {/* Center Table Pile */}
      <div style={{
        position: 'relative',
        width: '340px',
        height: '340px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 'auto'
      }}>
        {/* Animated circular rotation indicator */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          transform: !isClockwise ? 'scaleX(-1)' : 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'transform 0.5s ease'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'spin-clockwise 15s linear infinite'
          }}>
            <svg viewBox="0 0 200 200" style={{ width: '280px', height: '280px', overflow: 'visible' }}>
              <defs>
                <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Circular track */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="4"
                strokeDasharray="8, 8"
              />

              {/* Top-Right Arrow */}
              <path
                d="M 100 20 A 80 80 0 0 1 177 85"
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#arrow-glow)"
              />
              <polygon
                points="177,78 183,93 170,89"
                fill="var(--accent-gold)"
                filter="url(#arrow-glow)"
              />

              {/* Bottom-Left Arrow */}
              <path
                d="M 100 180 A 80 80 0 0 1 23 115"
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#arrow-glow)"
              />
              <polygon
                points="23,122 17,107 29,113"
                fill="var(--accent-gold)"
                filter="url(#arrow-glow)"
              />
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
          {/* Draw Pile */}
          <div
            className="uno-card card-wild"
            style={{
              cursor: isMyTurn ? 'pointer' : 'default',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #1b1232 0%, #0a0514 100%)',
              borderColor: isMyTurn ? 'var(--accent-green)' : 'var(--accent-purple)',
              boxShadow: isMyTurn ? '0 0 15px var(--accent-green)' : undefined,
              width: '90px',
              height: '135px'
            }}
            onClick={() => {
              if (isMyTurn) {
                onDrawCard();
              }
            }}
          >
            <Layers size={20} />
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '6px' }}>DRAW</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {getHandCount(deckCount)} left
            </div>
          </div>

          {/* Discard Pile */}
          {currentCard && (
            <div
              className={`uno-card card-${currentCard.color}`}
              style={{
                cursor: 'default',
                width: '90px',
                height: '135px',
                borderColor: currentColor !== currentCard.color ? '#fff' : undefined,
                boxShadow: `0 0 20px ${
                  currentColor === 'red' ? '#d90429' :
                  currentColor === 'green' ? '#38b000' :
                  currentColor === 'blue' ? '#00b4d8' : '#ffb703'
                }`
              }}
            >
              <div style={{ alignSelf: 'flex-start', fontSize: '13px' }}>
                {currentCard.value.toUpperCase()}
              </div>
              <div className="uno-card-center-symbol" style={{ fontSize: '28px' }}>
                {getUnoCardSymbol(currentCard.value)}
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: '13px', transform: 'rotate(180deg)' }}>
                {currentCard.value.toUpperCase()}
              </div>
              {/* Color Indicator suit badge */}
              <div style={{
                position: 'absolute', bottom: '-22px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.85)', padding: '2px 8px', borderRadius: '10px',
                fontSize: '10px', color: '#fff', whiteSpace: 'nowrap',
                border: `1.5px solid ${
                  currentColor === 'red' ? '#d90429' :
                  currentColor === 'green' ? '#38b000' :
                  currentColor === 'blue' ? '#00b4d8' : '#ffb703'
                }`
              }}>
                Suit: {currentColor.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slot for <UnoHand /> — kept inside `.uno-table` to preserve original layout */}
      {children}
    </div>
  );
};

export { getUnoCardSymbol };
export type { UnoCard };
export default UnoBoard;
