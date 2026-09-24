import React, { useEffect, useRef } from 'react';
import { X, Home, Building2, Hammer, Landmark, Coins, Trash2 } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap } from './boardData';
import type { MonopolyGameState, MonopolyRoom } from './types';
import './monopoly.css';

export interface PropertyDetailModalProps {
  spaceIndex: number;
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onClose: () => void;
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
  onSellProperty: (spaceIndex: number) => void;
  onBuildHouse: (spaceIndex: number) => void;
  onSellHouse: (spaceIndex: number) => void;
}

/**
 * Property card overlay shown when a player clicks a board space.
 * NOTE: this deliberately renders as an absolutely-positioned overlay INSIDE
 * the board's center panel (matching the original App.tsx behavior), rather
 * than a page-level dialog, since it needs to sit within `.monopoly-center-panel`.
 * If the shared `Modal` primitive is wired in later, this can be swapped to use
 * it directly - see the ambiguity note in the handoff report.
 */
export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  spaceIndex,
  gameState,
  room,
  currentUserId,
  onClose,
  onMortgage,
  onUnmortgage,
  onSellProperty,
  onBuildHouse,
  onSellHouse
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const properties = gameState.gameSpecificState?.properties || {};
  const space = MONOPOLY_BOARD[spaceIndex];
  const prop = properties[spaceIndex];

  useEffect(() => {
    if (!space) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [spaceIndex, space]);

  if (!space) return null;

  const isSpaceOwned = !!(prop && prop.ownerId);
  const spaceOwner = isSpaceOwned ? room?.players?.find(p => p.id === prop.ownerId) : null;
  const isOwnedByMe = !!(prop && prop.ownerId === currentUserId);
  const isSpaceMortgaged = !!(prop && prop.mortgaged);
  const headerColor = space.group ? (colorGroupMap[space.group] || '#7b2cbf') : '#ffffff';
  const mortgageEnabled = gameState.gameSpecificState?.config?.mortgage !== false;
  const cashValue = gameState.gameSpecificState?.cash?.[currentUserId] ?? 0;
  const houseCost = space.houseCost ?? 0;
  const unmortgageCost = Math.round((space.mortgageValue ?? (space.price ?? 0) * 0.5) * 1.1);
  const canBuild = !isSpaceMortgaged && (prop?.houses ?? 0) < 5 && cashValue >= houseCost;
  const canUnmortgage = cashValue >= unmortgageCost;

  return (
    <div className="monopoly-detail-overlay" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(6, 2, 10, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      borderRadius: '8px',
      padding: '16px',
      boxSizing: 'border-box'
    }} ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${space.name} property details`}>
      <div className="glass-panel monopoly-detail-card" style={{
        width: '320px',
        background: 'rgba(30, 20, 50, 0.95)',
        border: `1.5px solid ${space.group ? headerColor : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${space.group ? headerColor : 'rgba(123,44,191,0.1)'}30`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%'
      }}>
        {/* Header Banner */}
        <div style={{
          backgroundColor: space.group ? headerColor : 'rgba(255,255,255,0.06)',
          padding: '16px',
          textAlign: 'center',
          position: 'relative',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close property details"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <X size={12} />
          </button>

          {space.flag && (
            <div style={{
              width: '40px',
              height: '28px',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              margin: '0 auto 8px'
            }}>
              <img src={space.flag} alt={`${space.name} flag`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {space.name}
          </h3>
          {space.price !== undefined && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: '500' }}>
              Purchase Price: ${space.price}
            </div>
          )}
        </div>

        {/* Card Content / Details */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="lobby-settings-scroll">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
            {isSpaceOwned ? (
              <span style={{ fontWeight: 'bold', color: isOwnedByMe ? 'var(--accent-green)' : 'var(--accent-pink)' }}>
                Owned by {isOwnedByMe ? 'You' : spaceOwner?.name} {isSpaceMortgaged ? '(Mortgaged)' : ''}
              </span>
            ) : (
              <span style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>Unowned / Available</span>
            )}
          </div>

          {space.type === 'property' && space.rent && (() => {
            const rent = space.rent;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  <span>Base Rent:</span>
                  <strong>${rent[0]}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                  <span>With Full Group (x2 Rent):</span>
                  <strong>${rent[0] * 2}</strong>
                </div>
                {[1, 2, 3, 4].map(h => (
                  <div key={h} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Array.from({ length: h }).map((_, i) => <Home key={i} size={11} />)}
                      With {h} House{h > 1 ? 's' : ''}:
                    </span>
                    <strong>${rent[h]}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', fontWeight: 'bold', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={13} /> With Hotel:</span>
                  <strong>${rent[5]}</strong>
                </div>
              </div>
            );
          })()}

          {space.type === 'railroad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                <span>1 Airport Owned:</span><strong>$25</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                <span>2 Airports Owned:</span><strong>$50</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                <span>3 Airports Owned:</span><strong>$100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                <span>4 Airports Owned:</span><strong>$200</strong>
              </div>
            </div>
          )}

          {space.type === 'utility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: '4px', textAlign: 'center', lineHeight: '1.4' }}>
                Rent is calculated based on dice roll value.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                <span>1 Utility Owned:</span><strong>4x Dice Roll</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                <span>2 Utilities Owned:</span><strong>10x Dice Roll</strong>
              </div>
            </div>
          )}

          {space.mortgageValue !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <span>Mortgage Value:</span>
              <strong>${space.mortgageValue}</strong>
            </div>
          )}
        </div>

        {/* Action Panel Footer */}
        {isOwnedByMe && prop && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0
          }}>
            {space.type === 'property' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => onBuildHouse(spaceIndex)}
                  disabled={!canBuild}
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', opacity: canBuild ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Hammer size={13} /> Build (+${space.houseCost})
                </button>
                <button
                  onClick={() => onSellHouse(spaceIndex)}
                  disabled={prop.houses === 0}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', opacity: prop.houses === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Home size={13} /> Sell (-${Math.floor((space.houseCost || 0) * 0.5)})
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {mortgageEnabled && (
                <button
                  onClick={() => (isSpaceMortgaged ? onUnmortgage(spaceIndex) : onMortgage(spaceIndex))}
                  disabled={prop.houses > 0 || (isSpaceMortgaged && !canUnmortgage)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', opacity: (prop.houses > 0 || (isSpaceMortgaged && !canUnmortgage)) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {isSpaceMortgaged ? <Landmark size={13} /> : <Coins size={13} />}
                  {isSpaceMortgaged ? 'Unmortgage' : 'Mortgage'}
                </button>
              )}

              <button
                onClick={() => {
                  onSellProperty(spaceIndex);
                  onClose();
                }}
                disabled={prop.houses > 0}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, var(--accent-pink) 0%, #b3001e 100%)',
                  boxShadow: '0 0 10px rgba(217,4,41,0.2)',
                  opacity: prop.houses > 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Sell back to the bank for 50% of purchase price"
              >
                <Trash2 size={13} /> Sell (${Math.floor((space.price || 0) * 0.5)})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetailModal;
