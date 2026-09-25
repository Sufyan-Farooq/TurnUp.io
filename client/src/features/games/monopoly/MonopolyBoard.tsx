import React, { useState } from 'react';
import { ArrowRight, Lock, Palmtree, Siren, Home, Building2, Unlock } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap, getMonopolySpaceGridCoords, getMonopolyCoords, getSpaceSide, getMonopolySpaceIcon, AVATAR_COLORS } from './boardData';
import { PropertyDetailModal } from './PropertyDetailModal';
import { AuctionOverlay } from './AuctionOverlay';
import { DiceDisplay, useRollAnimation } from './DiceDisplay';
import type { MonopolyGameState, MonopolyRoom } from './types';
import './monopoly.css';

export interface MonopolyBoardProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onSellProperty: (spaceIndex: number) => void;
  onBuildHouse: (spaceIndex: number) => void;
  onSellHouse: (spaceIndex: number) => void;
  onDeclareBankruptcy: () => void;
  onBid: (amount: number) => void;
  onFold: () => void;
  /** Optional trailing game-log lines shown under the dice in the center panel. */
  recentLogs?: string[];
}

const getSolidColor = (c: string, fallback: string): string => {
  if (!c) return fallback;
  if (c.startsWith('linear-gradient')) {
    const match = c.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
    return match ? match[0] : fallback;
  }
  return c;
};

/**
 * The 48-space Monopoly board: grid of spaces + player tokens + the center
 * panel (dice / roll-buy-pass-endturn-jail-bankruptcy controls / property
 * detail modal / auction overlay). The active-trade banner and trade
 * constructor live in TradeModal, rendered as a sibling by the parent.
 */
export const MonopolyBoard: React.FC<MonopolyBoardProps> = ({
  gameState,
  room,
  currentUserId,
  onRollDice,
  onBuyProperty,
  onEndTurn,
  onPayJailFine,
  onMortgage,
  onUnmortgage,
  onSellProperty,
  onBuildHouse,
  onSellHouse,
  onDeclareBankruptcy,
  onBid,
  onFold,
  recentLogs = []
}) => {
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const lastRoll = gameState.gameSpecificState?.lastRoll;
  const { isRolling, diceValues, triggerRoll } = useRollAnimation(onRollDice, gameState.historyLength ?? 0, lastRoll);

  const properties = gameState.gameSpecificState?.properties || {};
  const positions = gameState.gameSpecificState?.positions || {};
  const bankrupt = gameState.gameSpecificState?.bankrupt || {};
  const subState = gameState.subState;
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const cashValue = gameState.gameSpecificState?.cash?.[currentUserId] || 0;
  const currentSpace = MONOPOLY_BOARD[positions[currentUserId]];
  const canBuyCurrentSpace = !!currentSpace?.price && cashValue >= currentSpace.price;

  const activePlayer = room?.players?.find(p => p.id === gameState.activePlayerId);
  const activePlayerName = activePlayer ? activePlayer.name : 'Unknown';

  // Precompute shared-cell token offsets (multiple players on the same space).
  const sharedCoords: Record<string, { pId: string }[]> = {};
  Object.entries(positions).forEach(([pId, pos]) => {
    if (bankrupt[pId]) return;
    const coords = getMonopolyCoords(pos);
    const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
    if (!sharedCoords[key]) sharedCoords[key] = [];
    sharedCoords[key].push({ pId });
  });

  return (
    <div className="monopoly-board-grid">
      {/* Center Area */}
      <div className="monopoly-center-panel" style={{ position: 'relative' }}>
        {selectedSpaceIndex !== null && (
          <PropertyDetailModal
            spaceIndex={selectedSpaceIndex}
            gameState={gameState}
            room={room}
            currentUserId={currentUserId}
            onClose={() => setSelectedSpaceIndex(null)}
            onMortgage={onMortgage}
            onUnmortgage={onUnmortgage}
            onSellProperty={onSellProperty}
            onBuildHouse={onBuildHouse}
            onSellHouse={onSellHouse}
          />
        )}

        <AuctionOverlay gameState={gameState} room={room} currentUserId={currentUserId} onBid={onBid} onFold={onFold} />

        <div className="monopoly-center-content">
          <h1 className="monopoly-title">Mr. Worldwide</h1>
          <div className={`monopoly-turn-status${isMyTurn ? ' is-mine' : ''}`} role="status" aria-live="polite">
            {isMyTurn ? 'Your move' : `${activePlayerName} is making a move`}
          </div>

          <div className="monopoly-dice-stage">
            <DiceDisplay
              value={isRolling ? diceValues[0] : (lastRoll?.[0] || 3)}
              rolling={isRolling}
              size={120}
              onClick={isMyTurn && !isRolling && (subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') ? triggerRoll : undefined}
            />
            <DiceDisplay
              value={isRolling ? diceValues[1] : (lastRoll?.[1] || 4)}
              rolling={isRolling}
              size={120}
              onClick={isMyTurn && !isRolling && (subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') ? triggerRoll : undefined}
            />
          </div>

          {!isRolling && lastRoll && lastRoll[0] > 0 && (
            <div className="monopoly-roll-result" aria-live="polite">
              {lastRoll[0]} + {lastRoll[1]} = <strong>{lastRoll[0] + lastRoll[1]}</strong>
              {lastRoll[0] === lastRoll[1] && (
                <span>Doubles</span>
              )}
            </div>
          )}

          <div className="monopoly-actions">
            {isMyTurn ? (
              <>
                {(subState === 'WAITING_FOR_ROLL' || subState === 'WAITING_FOR_JAIL_DECISION') && (
                  <button onClick={triggerRoll} disabled={isRolling} className="btn-primary" style={{ padding: '12px 30px', fontSize: '14.5px' }}>
                    {isRolling ? 'Rolling…' : 'Roll the dice'}
                  </button>
                )}

                {subState === 'WAITING_FOR_JAIL_DECISION' && cashValue >= 50 && (
                  <button onClick={onPayJailFine} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Unlock size={14} /> Pay Jail Fine ($50)
                  </button>
                )}

                {subState === 'WAITING_FOR_BUY_OR_PASS' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onBuyProperty} disabled={!canBuyCurrentSpace} className="btn-primary" style={{ padding: '12px 24px', fontSize: '13.5px', background: 'linear-gradient(135deg, var(--gold) 0%, #cc8800 100%)', boxShadow: '0 4px 15px var(--gold-glow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} /> {canBuyCurrentSpace ? `Buy for $${currentSpace.price}` : 'Not enough cash'}
                    </button>
                    <button onClick={onEndTurn} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Pass <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {subState === 'WAITING_FOR_TURN_END' && (
                  <button onClick={onEndTurn} className="btn-primary" style={{ padding: '12px 30px', fontSize: '14.5px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #2b8c00 100%)', boxShadow: '0 4px 15px rgba(56,176,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    End turn <ArrowRight size={14} />
                  </button>
                )}

                {subState === 'DEBT_OR_BANKRUPT' && (
                  <button onClick={onDeclareBankruptcy} className="btn-danger" style={{ padding: '12px 24px' }}>
                    Declare Bankruptcy
                  </button>
                )}
              </>
            ) : (
              <div className="monopoly-waiting">
                Waiting for <strong>{activePlayerName}</strong>
              </div>
            )}
          </div>

          {recentLogs.length > 0 && (
            <div className="monopoly-log" aria-live="polite" aria-label="Recent game activity">
              <div className="monopoly-log-label">Latest activity</div>
              {recentLogs.slice(-4).map((log, lIdx, arr) => {
                const isLatest = lIdx === arr.length - 1;
                return (
                  <div
                    key={lIdx}
                    className={`monopoly-log-entry${isLatest ? ' is-latest' : ''}`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 48 Spaces */}
      {MONOPOLY_BOARD.map((space, idx) => {
        const coords = getMonopolySpaceGridCoords(idx);
        const prop = properties[idx];
        const ownerIdx = prop && prop.ownerId ? room.players.findIndex(p => p.id === prop.ownerId) : -1;
        const isOwned = ownerIdx !== -1;
        const isMortgaged = !!(prop && prop.mortgaged);
        const side = getSpaceSide(idx);
        const isCorner = idx === 0 || idx === 12 || idx === 24 || idx === 36;
        const isActivePos = idx === positions[gameState.activePlayerId];

        const ownerPlayer = isOwned ? room?.players?.[ownerIdx] : null;
        const rawOwnerColor = isOwned ? (ownerPlayer?.color || AVATAR_COLORS[ownerIdx % AVATAR_COLORS.length]) : '';
        const ownerSolidColor = getSolidColor(rawOwnerColor, '#130c24');

        let backgroundStyle = isCorner ? '#0d061f' : '#130c24';
        if (isOwned && !isCorner) {
          backgroundStyle = `linear-gradient(rgba(19, 12, 36, 0.93), rgba(19, 12, 36, 0.93)), ${ownerSolidColor}`;
        }

        const renderHeaderBand = () => {
          if (!space.group) return null;
          const colorCode = colorGroupMap[space.group || ''] || 'var(--accent-purple)';
          return <div style={{ backgroundColor: colorCode, width: '100%', height: '8px', borderRadius: '1px', flexShrink: 0 }} />;
        };

        const renderPriceOrOwnerBadge = () => {
          if (space.price === undefined) return null;
          if (isOwned && ownerPlayer) {
            return (
              <div style={{
                fontSize: '8.5px', color: '#fff', fontWeight: 900, backgroundColor: ownerSolidColor,
                padding: '2px 6px', borderRadius: '3px', boxShadow: `0 0 6px ${ownerSolidColor}80`,
                textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1, flexShrink: 0
              }}>
                {ownerPlayer?.name.substring(0, 4)}
              </div>
            );
          }
          return (
            <div style={{
              fontSize: '9px', color: 'rgba(255,255,255,0.75)', fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2px 6px', borderRadius: '3px', lineHeight: 1, flexShrink: 0
            }}>
              {space.price}$
            </div>
          );
        };

        let ownershipClass = '';
        let customProperties: React.CSSProperties = {};
        if (isOwned && prop) {
          const isGlowHover = hoveredPlayerId === prop.ownerId;
          if (isGlowHover) ownershipClass = 'glow-owned-player';
          else if (prop.ownerId === currentUserId) ownershipClass = 'owned-by-me';
          else ownershipClass = 'owned-by-other';
          customProperties = {
            '--owner-color': ownerSolidColor,
            '--owner-color-shadow': `${ownerSolidColor}35`
          } as React.CSSProperties;
        }

        if (idx === 0) {
          return (
            <div key={idx} className="monopoly-space group-special corner-space" style={{
              gridRow: coords.row, gridColumn: coords.col,
              border: isActivePos ? '3px solid var(--accent-green)' : undefined,
              boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px',
              background: 'linear-gradient(135deg, #1e3514 0%, #11200a 100%)', borderBottom: '4px solid #38b000', borderRadius: '4px', position: 'relative'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#38b000', letterSpacing: '1px' }}>START</span>
              <ArrowRight size={26} color="#38b000" style={{ marginTop: '4px', filter: 'drop-shadow(0 2px 5px rgba(56,176,0,0.5))' }} />
            </div>
          );
        }

        if (idx === 12) {
          return (
            <div key={idx} className={`monopoly-space group-special corner-space ${ownershipClass}`} style={{
              gridRow: coords.row, gridColumn: coords.col,
              border: isActivePos ? '3px solid var(--accent-green)' : undefined,
              boxShadow: isActivePos ? '0 0 15px var(--accent-green), inset 0 0 8px rgba(56, 176, 0, 0.1)' : undefined,
              display: 'flex', flexDirection: 'column', padding: 0, boxSizing: 'border-box',
              background: '#130c24', borderRadius: '4px', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 4px', fontSize: '9px', fontWeight: 'bold', color: '#fff', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                Passing by
              </div>
              <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={18} />
                </div>
                <div style={{ width: '32px', background: '#1c1430', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', padding: '2px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '14px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '22px', width: '2px', background: 'rgba(255, 255, 255, 0.4)' }} />
                  <div style={{ fontSize: '7px', color: 'var(--accent-pink)', fontWeight: 'bold', textTransform: 'uppercase', writingMode: 'vertical-rl', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    In Prison
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (idx === 24) {
          return (
            <div key={idx} className="monopoly-space group-special corner-space" style={{
              gridRow: coords.row, gridColumn: coords.col,
              border: isActivePos ? '3px solid var(--accent-green)' : undefined,
              boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px',
              background: 'linear-gradient(135deg, #3a2e12 0%, #201a0a 100%)', borderBottom: '4px solid var(--accent-gold)', borderRadius: '4px', position: 'relative'
            }}>
              <Palmtree size={24} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 2px 5px rgba(255,183,3,0.4))' }} />
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '4px', textTransform: 'uppercase' }}>Vacation</span>
            </div>
          );
        }

        if (idx === 36) {
          return (
            <div key={idx} className="monopoly-space group-special corner-space" style={{
              gridRow: coords.row, gridColumn: coords.col,
              border: isActivePos ? '3px solid var(--accent-green)' : undefined,
              boxShadow: isActivePos ? '0 0 15px var(--accent-green)' : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px',
              background: 'linear-gradient(135deg, #3d101a 0%, #20080d 100%)', borderBottom: '4px solid var(--accent-pink)', borderRadius: '4px', position: 'relative'
            }}>
              <Siren size={24} color="var(--accent-pink)" style={{ filter: 'drop-shadow(0 2px 5px rgba(217,4,41,0.4))' }} />
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-pink)', marginTop: '4px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>Go to<br />prison</span>
            </div>
          );
        }

        const isLeftOrRight = side === 'left' || side === 'right';
        const rotationAngle = side === 'left' ? -90 : side === 'right' ? 90 : 0;

        return (
          <div
            key={idx}
            className={`monopoly-space ${space.group ? `group-${space.group}` : 'group-special'} ${isCorner ? 'corner-space' : ''} ${ownershipClass}`}
            style={{
              gridRow: coords.row, gridColumn: coords.col,
              border: isActivePos ? '3px solid var(--accent-green)' : undefined,
              boxShadow: isActivePos ? '0 0 15px var(--accent-green), inset 0 0 8px rgba(56, 176, 0, 0.1)' : undefined,
              display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, boxSizing: 'border-box',
              background: backgroundStyle, borderRadius: isCorner ? '4px' : '2px', position: 'relative',
              cursor: (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') ? 'pointer' : 'default',
              overflow: 'hidden',
              ...customProperties
            }}
            onClick={() => {
              if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
                setSelectedSpaceIndex(idx);
              }
            }}
            onKeyDown={(event) => {
              if ((space.type === 'property' || space.type === 'railroad' || space.type === 'utility') && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                setSelectedSpaceIndex(idx);
              }
            }}
            role={(space.type === 'property' || space.type === 'railroad' || space.type === 'utility') ? 'button' : undefined}
            tabIndex={(space.type === 'property' || space.type === 'railroad' || space.type === 'utility') ? 0 : undefined}
            aria-label={(space.type === 'property' || space.type === 'railroad' || space.type === 'utility') ? `View ${space.name} details${isOwned && ownerPlayer ? `, owned by ${ownerPlayer.name}` : ', unowned'}` : undefined}
          >
            <div style={{
              width: isLeftOrRight ? '74px' : '100%',
              height: isLeftOrRight ? '92.6px' : '100%',
              transform: isLeftOrRight ? `rotate(${rotationAngle}deg)` : undefined,
              transformOrigin: 'center center',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 6px', boxSizing: 'border-box',
              position: isLeftOrRight ? 'absolute' : 'relative',
              top: isLeftOrRight ? 'calc(50% - 46.3px)' : undefined,
              left: isLeftOrRight ? 'calc(50% - 37px)' : undefined
            }}>
              {side === 'bottom' ? (
                <>
                  {renderHeaderBand()}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center', width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px', lineHeight: '1.2', color: '#fff', width: '100%', wordBreak: 'break-word', textAlign: 'center' }}>
                      {space.name}
                    </div>
                    {space.flag ? (
                      <div style={{ width: '24px', height: '16px', borderRadius: '2px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                        <img src={space.flag} alt={`${space.name} flag`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : getMonopolySpaceIcon(space.type, space.name) ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {getMonopolySpaceIcon(space.type, space.name)}
                      </div>
                    ) : null}
                  </div>
                  {renderPriceOrOwnerBadge()}
                </>
              ) : (
                <>
                  {renderPriceOrOwnerBadge()}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center', width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px', lineHeight: '1.2', color: '#fff', width: '100%', wordBreak: 'break-word', textAlign: 'center' }}>
                      {space.name}
                    </div>
                    {space.flag ? (
                      <div style={{ width: '24px', height: '16px', borderRadius: '2px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                        <img src={space.flag} alt={`${space.name} flag`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : getMonopolySpaceIcon(space.type, space.name) ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {getMonopolySpaceIcon(space.type, space.name)}
                      </div>
                    ) : null}
                  </div>
                  {renderHeaderBand()}
                </>
              )}
            </div>

            {prop && prop.houses > 0 && !isMortgaged && (
              <div className="houses-container" style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '6px', left: '6px', zIndex: 10 }}>
                {prop.houses === 5 ? (
                  <span title="1 Hotel"><Building2 size={12} style={{ filter: 'drop-shadow(0 0 3px var(--accent-pink))' }} /></span>
                ) : (
                  Array.from({ length: prop.houses }).map((_, hIdx) => (
                    <span key={hIdx} title={`${prop.houses} Houses`}><Home size={10} style={{ filter: 'drop-shadow(0 0 3px var(--accent-green))' }} /></span>
                  ))
                )}
              </div>
            )}

            {isMortgaged && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(217, 4, 41, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '10px', color: '#fff', textShadow: '1px 1px 2px #000', zIndex: 20 }}>
                MORTGAGED
              </div>
            )}
          </div>
        );
      })}

      {/* Tokens */}
      {Object.entries(positions).map(([pId, pos], idx) => {
        if (bankrupt[pId]) return null;

        const coords = getMonopolyCoords(pos);
        const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
        const shared = sharedCoords[key] || [];
        const count = shared.length;
        const indexInCell = shared.findIndex(t => t.pId === pId);

        let ox = 0, oy = 0;
        if (count > 1) {
          const angle = (indexInCell / count) * 2 * Math.PI;
          const radius = 14;
          ox = Math.cos(angle) * radius;
          oy = Math.sin(angle) * radius;
        }

        const playerObj = room?.players?.find(p => p.id === pId);
        const customColor = playerObj?.color;
        const isHovered = hoveredPlayerId === pId;

        const tokenProperties = isHovered ? { '--token-color': customColor || 'var(--accent-purple)' } as React.CSSProperties : {};

        return (
          <div
            key={pId}
            className={`monopoly-token ${customColor ? '' : `color-${idx}`} ${isHovered ? 'pulsing-token' : ''}`}
            style={{
              left: `${coords.x + ox}px`,
              top: `${coords.y + oy}px`,
              zIndex: isHovered ? 500 : (300 + idx),
              backgroundColor: customColor || undefined,
              boxShadow: !isHovered && customColor ? `0 0 10px ${customColor}` : undefined,
              ...tokenProperties
            }}
            title={playerObj?.name}
            role="img"
            aria-label={`${playerObj?.name || 'Player'} token on ${MONOPOLY_BOARD[pos]?.name || `space ${pos}`}${pId === gameState.activePlayerId ? ', active player' : ''}`}
            onMouseEnter={() => setHoveredPlayerId(pId)}
            onMouseLeave={() => setHoveredPlayerId(null)}
          />
        );
      })}
    </div>
  );
};

export default MonopolyBoard;
