import React from 'react';
import { Crown, Lock, Skull, Handshake, Ban } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap, AVATAR_COLORS } from './boardData';
import type { MonopolyGameState, MonopolyRoom } from './types';
import type { VoteKickState } from '../../room/types';
import './monopoly.css';

export interface MonopolySidebarProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onBuildHouse: (spaceIndex: number) => void;
  onSellHouse: (spaceIndex: number) => void;
  onOpenTradeWith?: (targetPlayerId: string) => void;
  onHoverPlayer?: (playerId: string | null) => void;
  voteKickState?: VoteKickState | null;
  voteKickCountdown?: number;
  onOpenVoteKickPanel?: () => void;
}

export const MonopolySidebar: React.FC<MonopolySidebarProps> = ({
  gameState, room, currentUserId, onMortgage, onUnmortgage, onBuildHouse,
  onSellHouse, onOpenTradeWith, onHoverPlayer, voteKickState, voteKickCountdown, onOpenVoteKickPanel
}) => {
  const cash = gameState.gameSpecificState.cash || {};
  const properties = gameState.gameSpecificState.properties || {};
  const inJail = gameState.gameSpecificState.inJail || {};
  const bankrupt = gameState.gameSpecificState.bankrupt || {};
  const mortgageEnabled = gameState.gameSpecificState?.config?.mortgage !== false;
  const currentUserCash = cash[currentUserId] ?? 0;
  const myOwnedProperties = Object.entries(properties)
    .map(([idx, prop]) => ({ index: parseInt(idx, 10), prop }))
    .filter(item => item.prop.ownerId === currentUserId);

  return (
    <aside className="monopoly-sidebar" aria-label="Monopoly players and property portfolio">
      <header className="monopoly-sidebar-section">
        <h3 className="monopoly-section-title">Players &amp; balances</h3>
      </header>
      <div className="monopoly-player-list">
        {room?.players?.map((player, index) => {
          const playerCash = cash[player.id] !== undefined ? cash[player.id] : 1500;
          const playerInJail = inJail[player.id];
          const playerBankrupt = bankrupt[player.id];
          const avatarBg = player.color || AVATAR_COLORS[index % AVATAR_COLORS.length];
          const isActive = player.id === gameState.activePlayerId;
          return (
            <article key={player.id} className={`monopoly-player-card${isActive ? ' is-active' : ''}`}
              onMouseEnter={() => onHoverPlayer?.(player.id)} onMouseLeave={() => onHoverPlayer?.(null)}
              aria-current={isActive ? 'true' : undefined}>
              <div className="monopoly-player-identity">
                <div className="monopoly-player-avatar" style={{ background: avatarBg }} aria-hidden="true">{player.name.charAt(0)}</div>
                <div className="monopoly-player-copy">
                  <span className={`monopoly-player-name${playerBankrupt ? ' is-bankrupt' : ''}`}>
                    {player.name}{player.id === currentUserId ? ' · You' : ''}
                  </span>
                  <div className="monopoly-player-badges">
                    {voteKickState?.targetPlayerId === player.id && (
                      <button
                        type="button"
                        className="monopoly-player-badge is-alert"
                        onClick={onOpenVoteKickPanel}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        title="Vote kick in progress. Click to view details"
                      >
                        <Ban size={9} /> Kick: {Object.values(voteKickState.votes || {}).filter(v => v === true).length}/{voteKickState.requiredVotes} ({voteKickCountdown}s)
                      </button>
                    )}
                    {isActive && <span className="monopoly-player-badge">Playing now</span>}
                    {player.id === room?.hostId && <span className="monopoly-player-badge"><Crown size={9} /> Host</span>}
                    {playerInJail && <span className="monopoly-player-badge"><Lock size={9} /> In jail</span>}
                    {playerBankrupt && <span className="monopoly-player-badge is-alert"><Skull size={9} /> Bankrupt</span>}
                  </div>
                </div>
              </div>
              <div className="monopoly-player-actions">
                {player.id !== currentUserId && !playerBankrupt && onOpenTradeWith && (
                  <button type="button" className="monopoly-trade-button" onClick={() => onOpenTradeWith(player.id)} aria-label={`Propose a trade with ${player.name}`}>
                    <Handshake size={13} /><span>Trade</span>
                  </button>
                )}
                <span className={`monopoly-balance${playerCash < 0 ? ' is-negative' : ''}`}>${playerCash.toLocaleString()}</span>
              </div>
            </article>
          );
        })}
      </div>

      <header className="monopoly-sidebar-section">
        <h3 className="monopoly-section-title">Properties · {myOwnedProperties.length}</h3>
      </header>
      <div className="monopoly-property-list">
        {myOwnedProperties.length === 0 ? (
          <div className="monopoly-empty-properties">Your portfolio is empty. Land on an available property to start building it.</div>
        ) : myOwnedProperties.map(({ index, prop }) => {
          const space = MONOPOLY_BOARD[index];
          const isStreet = space.type === 'property';
          const colorCode = colorGroupMap[space.group || ''] || 'var(--gold)';
          const mortgageValue = Math.round(space.mortgageValue ?? (space.price || 0) * 0.5);
          const unmortgageValue = Math.round(mortgageValue * 1.1);
          return (
            <article key={index} className="monopoly-property-card" style={{ '--property-color': colorCode } as React.CSSProperties}>
              <div className="monopoly-property-card-header">
                <div>
                  <div className="monopoly-property-name">{space.name}</div>
                  <div className="monopoly-property-meta">{space.group ? `${space.group} street` : space.type}</div>
                </div>
                {prop.mortgaged && <span className="monopoly-property-badge">Mortgaged</span>}
              </div>
              {isStreet && !prop.mortgaged && (
                <div className="monopoly-property-state">{prop.houses === 5 ? 'Hotel built' : `${prop.houses} ${prop.houses === 1 ? 'house' : 'houses'}`} · Build ${space.houseCost}</div>
              )}
              <div className="monopoly-property-actions">
                {mortgageEnabled && prop.mortgaged && (
                  <button type="button" onClick={() => onUnmortgage(index)} disabled={currentUserCash < unmortgageValue}
                    className="btn-primary" title={currentUserCash < unmortgageValue ? `You need $${unmortgageValue}` : undefined}>
                    Unmortgage · ${unmortgageValue}
                  </button>
                )}
                {(!prop.mortgaged || !mortgageEnabled) && <>
                  {mortgageEnabled && (
                    <button type="button" onClick={() => onMortgage(index)} className="btn-secondary" disabled={prop.houses > 0}
                      title={prop.houses > 0 ? 'Sell buildings before mortgaging' : undefined}>Mortgage · ${mortgageValue}</button>
                  )}
                  {isStreet && prop.houses < 5 && (
                    <button type="button" onClick={() => onBuildHouse(index)} disabled={currentUserCash < (space.houseCost ?? 0)} className="btn-primary">Build · ${space.houseCost}</button>
                  )}
                  {isStreet && prop.houses > 0 && (
                    <button type="button" onClick={() => onSellHouse(index)} className="btn-secondary">Sell building · ${Math.round((space.houseCost || 0) / 2)}</button>
                  )}
                </>}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
};

export default MonopolySidebar;
