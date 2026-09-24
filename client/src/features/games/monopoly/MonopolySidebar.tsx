import React from 'react';
import { Crown, Lock, Skull, Handshake } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap, AVATAR_COLORS } from './boardData';
import type { MonopolyGameState, MonopolyRoom } from './types';

export interface MonopolySidebarProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onBuildHouse: (spaceIndex: number) => void;
  onSellHouse: (spaceIndex: number) => void;
  /**
   * Requests the parent open the trade constructor (TradeModal) targeting this
   * player. Not part of the base action-callback contract since it opens UI
   * state rather than emitting a game action - see handoff notes.
   */
  onOpenTradeWith?: (targetPlayerId: string) => void;
  onHoverPlayer?: (playerId: string | null) => void;
}

export const MonopolySidebar: React.FC<MonopolySidebarProps> = ({
  gameState,
  room,
  currentUserId,
  onMortgage,
  onUnmortgage,
  onBuildHouse,
  onSellHouse,
  onOpenTradeWith,
  onHoverPlayer
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Players & Cash */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>Players &amp; Balances</h3>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
        {room?.players?.map((p, idx) => {
          const playerCash = cash[p.id] !== undefined ? cash[p.id] : 1500;
          const playerInJail = inJail[p.id];
          const playerBankrupt = bankrupt[p.id];
          const avatarBg = p.color || AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const isActive = p.id === gameState.activePlayerId;

          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: isActive ? 'rgba(56, 176, 0, 0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: `1.5px solid ${isActive ? 'rgba(56, 176, 0, 0.4)' : 'transparent'}`,
                boxShadow: isActive ? '0 0 10px rgba(56, 176, 0, 0.1)' : 'none',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={() => onHoverPlayer?.(p.id)}
              onMouseLeave={() => onHoverPlayer?.(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: avatarBg,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: idx === 3 ? '#000' : '#fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  textTransform: 'uppercase',
                  flexShrink: 0
                }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{
                    textDecoration: playerBankrupt ? 'line-through' : 'none',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    color: isActive ? 'var(--accent-green)' : '#fff'
                  }}>
                    {p.name} {p.id === currentUserId && ' (You)'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                    {p.id === room?.hostId && (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(255, 183, 3, 0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: '4px', padding: '0 4px', fontWeight: 'bold', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Crown size={9} /> Host
                      </span>
                    )}
                    {playerInJail && (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(255, 183, 3, 0.15)', color: 'var(--accent-gold)', borderRadius: '4px', padding: '0 4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Lock size={9} /> In Jail
                      </span>
                    )}
                    {playerBankrupt && (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(217, 4, 41, 0.15)', color: 'var(--accent-pink)', borderRadius: '4px', padding: '0 4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Skull size={9} /> Bankrupt
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.id !== currentUserId && !playerBankrupt && onOpenTradeWith && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTradeWith(p.id);
                    }}
                    style={{
                      background: 'rgba(123,44,191,0.1)',
                      border: '1px solid rgba(123,44,191,0.3)',
                      color: 'var(--accent-purple)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Handshake size={11} /> Trade
                  </button>
                )}
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: playerCash < 0 ? 'var(--accent-pink)' : 'var(--accent-green)',
                  background: playerCash < 0 ? 'rgba(217, 4, 41, 0.1)' : 'rgba(56, 176, 0, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${playerCash < 0 ? 'rgba(217, 4, 41, 0.2)' : 'rgba(56, 176, 0, 0.2)'}`
                }}>
                  ${playerCash}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Properties Manager */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(123,44,191,0.1)', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>My Properties ({myOwnedProperties.length})</h3>
      </div>
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {myOwnedProperties.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
            You don't own any properties yet. Land on properties to buy them!
          </div>
        ) : (
          myOwnedProperties.map(({ index, prop }) => {
            const space = MONOPOLY_BOARD[index];
            const isStreet = space.type === 'property';
            const colorCode = colorGroupMap[space.group || ''] || 'var(--accent-purple)';
            return (
              <div
                key={index}
                className="glass-panel"
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderTop: `5px solid ${colorCode}`,
                  borderRadius: '8px',
                  background: 'rgba(19, 12, 36, 0.5)',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'rgba(19, 12, 36, 0.75)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(19, 12, 36, 0.5)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#fff' }}>{space.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {space.group ? `${space.group.toUpperCase()} Street` : space.type.toUpperCase()}
                    </div>
                  </div>
                  {prop.mortgaged && (
                    <span style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      MORTGAGED
                    </span>
                  )}
                </div>

                {isStreet && !prop.mortgaged && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Houses: {prop.houses === 5 ? '1 Hotel' : `${prop.houses}`} (Build: ${space.houseCost})
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {mortgageEnabled && prop.mortgaged && (
                    <button
                      onClick={() => onUnmortgage(index)}
                      disabled={currentUserCash < Math.round((space.mortgageValue ?? (space.price || 0) * 0.5) * 1.1)}
                      className="btn-primary"
                      style={{ padding: '4px 10px', fontSize: '11px', boxShadow: 'none', height: '28px', display: 'flex', alignItems: 'center' }}
                    >
                      Unmortgage (${Math.round((space.price || 0) * 0.5 * 1.1)})
                    </button>
                  )}

                  {(!prop.mortgaged || !mortgageEnabled) && (
                    <>
                      {mortgageEnabled && (
                        <button
                          onClick={() => onMortgage(index)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', height: '28px', display: 'flex', alignItems: 'center' }}
                          disabled={prop.houses > 0}
                        >
                          Mortgage (${Math.round((space.price || 0) * 0.5)})
                        </button>
                      )}
                      {isStreet && prop.houses < 5 && (
                        <button
                          onClick={() => onBuildHouse(index)}
                          disabled={currentUserCash < (space.houseCost ?? 0)}
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', boxShadow: 'none', height: '28px', display: 'flex', alignItems: 'center' }}
                        >
                          Build House (${space.houseCost})
                        </button>
                      )}
                      {isStreet && prop.houses > 0 && (
                        <button
                          onClick={() => onSellHouse(index)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', height: '28px', display: 'flex', alignItems: 'center' }}
                        >
                          Sell House (${Math.round((space.houseCost || 0) / 2)})
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MonopolySidebar;
