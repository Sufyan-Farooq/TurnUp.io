import React, { useEffect, useRef, useState } from 'react';
import { Handshake, Rocket } from 'lucide-react';
import { MONOPOLY_BOARD } from './boardData';
import type { MonopolyGameState, MonopolyRoom, TradeSide } from './types';
import './monopoly.css';

export interface TradeModalProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  /**
   * Player the current user wants to propose a trade to. Set by the parent
   * (e.g. clicking "Trade" next to a player in MonopolySidebar) to open the
   * constructor. Pass null to keep it closed. Ignored while a trade is
   * already active in gameState (the accept/reject view takes over).
   */
  targetPlayerId: string | null;
  onCloseConstructor: () => void;
  onInitiateTrade: (targetPlayerId: string, offer: TradeSide, request: TradeSide) => void;
  onAcceptTrade: () => void;
  onRejectTrade: () => void;
}

const isTradeableProperty = (properties: MonopolyGameState['gameSpecificState']['properties'], idx: number, ownerId: string): boolean => {
  const prop = properties[idx];
  if (!prop || prop.ownerId !== ownerId || prop.houses > 0) return false;
  const space = MONOPOLY_BOARD[idx];
  if (space.group) {
    const hasHouses = Object.entries(properties).some(([i, p]) => {
      const s = MONOPOLY_BOARD[parseInt(i, 10)];
      return s.group === space.group && p.houses > 0;
    });
    if (hasHouses) return false;
  }
  return true;
};

/**
 * Combines the two trade-related overlays from the original App.tsx:
 *  - the active-trade accept/reject/negotiating-banner view (when
 *    gameState.gameSpecificState.activeTrade is set), and
 *  - the offer/request constructor (when the parent has set targetPlayerId).
 */
export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  room,
  currentUserId,
  targetPlayerId,
  onCloseConstructor,
  onInitiateTrade,
  onAcceptTrade,
  onRejectTrade
}) => {
  const [offerCash, setOfferCash] = useState(0);
  const [offerProperties, setOfferProperties] = useState<number[]>([]);
  const [requestCash, setRequestCash] = useState(0);
  const [requestProperties, setRequestProperties] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeTrade = gameState.gameSpecificState.activeTrade;
  const isTradeParticipant = !!activeTrade && (activeTrade.proposerId === currentUserId || activeTrade.receiverId === currentUserId);
  const dialogMode = activeTrade
    ? isTradeParticipant ? 'active' : 'closed'
    : targetPlayerId ? 'constructor' : 'closed';
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const escapeActionRef = useRef(onCloseConstructor);
  escapeActionRef.current = activeTrade ? onRejectTrade : onCloseConstructor;

  useEffect(() => {
    if (dialogMode === 'closed') return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escapeActionRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
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
  }, [dialogMode]);

  // --- Active trade: accept/reject/negotiating views take priority ---
  if (activeTrade) {
    const proposerName = room?.players?.find(p => p.id === activeTrade.proposerId)?.name || 'Unknown';
    const receiverName = room?.players?.find(p => p.id === activeTrade.receiverId)?.name || 'Unknown';
    const isProposerMe = activeTrade.proposerId === currentUserId;
    const isReceiverMe = activeTrade.receiverId === currentUserId;

    if (!isProposerMe && !isReceiverMe) {
      return (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(123,44,191,0.18)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(123,44,191,0.4)',
          borderRadius: '20px',
          padding: '6px 16px',
          fontSize: '11.5px',
          color: 'rgba(255,255,255,0.85)',
          zIndex: 901,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Handshake size={13} /> <strong>{proposerName}</strong> is negotiating a trade with <strong>{receiverName}</strong>…
        </div>
      );
    }

    const getPropertyNamesList = (propIndices: number[]) => {
      if (!propIndices || propIndices.length === 0) return 'No properties';
      return propIndices.map(idx => MONOPOLY_BOARD[idx]?.name).join(', ');
    };

    return (
      <div ref={dialogRef} className="monopoly-trade-overlay" role="dialog" aria-modal="true" aria-label="Trade offer" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(6,2,10,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 900
      }}>
        <div className="glass-panel monopoly-trade-card" style={{
          width: '340px',
          padding: '22px',
          borderRadius: '12px',
          border: '1.5px solid var(--accent-purple)',
          background: 'rgba(123,44,191,0.05)',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Handshake size={13} /> Monopoly Trade Deal
          </span>

          <div style={{ margin: '14px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From: <strong>{proposerName}</strong></div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>To: <strong>{receiverName}</strong></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '12.5px' }}>
            <div style={{ padding: '8px', background: 'rgba(56,176,0,0.05)', borderRadius: '6px', border: '1px solid rgba(56,176,0,0.1)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>
                {isReceiverMe ? 'You Receive:' : 'Offering:'}
              </span>
              <div style={{ marginTop: '2px', color: '#fff' }}>Cash: ${activeTrade.offer.cash}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Properties: {getPropertyNamesList(activeTrade.offer.properties)}</div>
            </div>

            <div style={{ padding: '8px', background: 'rgba(217,4,41,0.05)', borderRadius: '6px', border: '1px solid rgba(217,4,41,0.1)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                {isReceiverMe ? 'You Give:' : 'Requesting:'}
              </span>
              <div style={{ marginTop: '2px', color: '#fff' }}>Cash: ${activeTrade.request.cash}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Properties: {getPropertyNamesList(activeTrade.request.properties)}</div>
            </div>
          </div>

          {isReceiverMe ? (
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={onAcceptTrade}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontWeight: 'bold', fontSize: '13px', background: 'linear-gradient(135deg, var(--accent-green) 0%, #2b8c00 100%)', boxShadow: '0 4px 15px rgba(56,176,0,0.3)' }}
              >
                Accept
              </button>
              <button onClick={onRejectTrade} className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                Reject
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Waiting for other player to respond...
              </span>
              <button onClick={onRejectTrade} className="btn-secondary" style={{ padding: '6px', fontSize: '12px' }}>
                Cancel Offer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Constructor: only shown when no trade is active and a target is chosen ---
  if (!targetPlayerId) return null;

  const targetPlayer = room?.players?.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return null;

  const cashMap = gameState.gameSpecificState.cash || {};
  const properties = gameState.gameSpecificState.properties || {};
  const myCash = cashMap[currentUserId] || 0;
  const targetCash = cashMap[targetPlayerId] || 0;

  const myTradeableProps = Object.keys(properties)
    .map(k => parseInt(k, 10))
    .filter(idx => isTradeableProperty(properties, idx, currentUserId))
    .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx].name }));

  const targetTradeableProps = Object.keys(properties)
    .map(k => parseInt(k, 10))
    .filter(idx => isTradeableProperty(properties, idx, targetPlayerId))
    .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx].name }));

  const toggleOfferProperty = (idx: number) => {
    setOfferProperties(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
  };

  const toggleRequestProperty = (idx: number) => {
    setRequestProperties(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
  };

  const handleSendOffer = () => {
    if (offerCash > myCash) {
      setValidationError('You cannot offer more cash than you own.');
      return;
    }
    if (requestCash > targetCash) {
      setValidationError('You cannot request more cash than target owns.');
      return;
    }
    setValidationError(null);
    onInitiateTrade(targetPlayerId, { cash: offerCash, properties: offerProperties }, { cash: requestCash, properties: requestProperties });
    setOfferCash(0);
    setOfferProperties([]);
    setRequestCash(0);
    setRequestProperties([]);
  };

  return (
    <div ref={dialogRef} className="monopoly-trade-overlay" role="dialog" aria-modal="true" aria-label={`Propose a trade with ${targetPlayer.name}`} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6,2,10,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel monopoly-trade-card monopoly-trade-builder" style={{
        width: '460px',
        padding: '24px',
        borderRadius: '16px',
        border: '1.5px solid var(--accent-purple)',
        background: 'rgba(123,44,191,0.04)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Handshake size={17} /> Propose Trade Deal to {targetPlayer.name}
        </h3>

        {validationError && (
          <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(217,4,41,0.12)', border: '1px solid rgba(217,4,41,0.3)', borderRadius: '6px', color: 'var(--accent-pink)', fontSize: '12px', textAlign: 'center' }}>
            {validationError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Give block */}
          <div style={{ padding: '12px', background: 'rgba(56,176,0,0.03)', border: '1px solid rgba(56,176,0,0.15)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              You Give
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${myCash})</label>
              <input
                type="number"
                min={0}
                max={myCash}
                value={offerCash}
                onChange={e => setOfferCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {myTradeableProps.length === 0 ? (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No eligible properties</span>
                ) : myTradeableProps.map(p => (
                  <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={offerProperties.includes(p.index)} onChange={() => toggleOfferProperty(p.index)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Receive block */}
          <div style={{ padding: '12px', background: 'rgba(217,4,41,0.03)', border: '1px solid rgba(217,4,41,0.15)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-pink)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              You Receive
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${targetCash})</label>
              <input
                type="number"
                min={0}
                max={targetCash}
                value={requestCash}
                onChange={e => setRequestCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {targetTradeableProps.length === 0 ? (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No eligible properties</span>
                ) : targetTradeableProps.map(p => (
                  <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={requestProperties.includes(p.index)} onChange={() => toggleRequestProperty(p.index)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleSendOffer} className="btn-primary" style={{ flex: 1.5, padding: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Rocket size={14} /> Send Deal
          </button>
          <button onClick={onCloseConstructor} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
