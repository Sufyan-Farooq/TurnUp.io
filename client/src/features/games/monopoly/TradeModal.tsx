import React, { useEffect, useRef, useState } from 'react';
import { Handshake, Rocket, Minus, Maximize2, AlertTriangle, Scale, Check, X, ArrowLeftRight, Eye } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap } from './boardData';
import type { MonopolyGameState, MonopolyRoom, TradeSide, TradeOffer } from './types';
import './monopoly.css';

export interface TradeModalProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  /**
   * Player the current user wants to propose a trade to. Set by the parent
   * (e.g. clicking "Trade" next to a player in MonopolySidebar or PropertyDetailModal)
   * to open the constructor. Pass null to keep it closed.
   */
  targetPlayerId: string | null;
  initialRequestedProp?: number | null;
  onCloseConstructor: () => void;
  onInitiateTrade: (targetPlayerId: string, offer: TradeSide, request: TradeSide) => void;
  onCounterTrade?: (offer: TradeSide, request: TradeSide) => void;
  onAcceptTrade: () => void;
  onRejectTrade: () => void;
}

export const isTradeableProperty = (
  properties: MonopolyGameState['gameSpecificState']['properties'],
  idx: number,
  ownerId: string
): boolean => {
  const prop = properties[idx];
  if (!prop || prop.ownerId !== ownerId || prop.houses > 0 || prop.mortgaged) return false;
  const space = MONOPOLY_BOARD[idx];
  if (space?.group) {
    const hasHouses = Object.entries(properties).some(([i, p]) => {
      const s = MONOPOLY_BOARD[parseInt(i, 10)];
      return s.group === space.group && p.houses > 0;
    });
    if (hasHouses) return false;
  }
  return true;
};

export const checkTradeConditions = (
  trade: TradeOffer,
  gameState: MonopolyGameState
): { isValid: boolean; reason?: string } => {
  const gss = gameState.gameSpecificState;
  if (!gss) return { isValid: false, reason: 'Game state not loaded.' };

  const cash = gss.cash || {};
  const bankrupt = gss.bankrupt || {};
  const properties = gss.properties || {};

  const { proposerId, receiverId, offer, request } = trade;

  if (bankrupt[proposerId]) {
    return { isValid: false, reason: 'Proposer has declared bankruptcy.' };
  }
  if (bankrupt[receiverId]) {
    return { isValid: false, reason: 'Recipient has declared bankruptcy.' };
  }

  const proposerCash = cash[proposerId] ?? 0;
  const receiverCash = cash[receiverId] ?? 0;

  if (proposerCash < 0 || (gameState.subState === 'DEBT_OR_BANKRUPT' && gameState.activePlayerId === proposerId)) {
    return { isValid: false, reason: 'Proposer is currently resolving debt.' };
  }
  if (receiverCash < 0 || (gameState.subState === 'DEBT_OR_BANKRUPT' && gameState.activePlayerId === receiverId)) {
    return { isValid: false, reason: 'Recipient is currently resolving debt.' };
  }

  if (offer.cash > 0 && proposerCash < offer.cash) {
    return { isValid: false, reason: `Proposer does not have enough cash (has $${proposerCash}, needs $${offer.cash}).` };
  }
  if (request.cash > 0 && receiverCash < request.cash) {
    return { isValid: false, reason: `Recipient does not have enough cash (has $${receiverCash}, needs $${request.cash}).` };
  }

  for (const spaceIndex of (offer.properties || [])) {
    const prop = properties[spaceIndex];
    const space = MONOPOLY_BOARD[spaceIndex];
    const name = space?.name || `Property #${spaceIndex}`;

    if (!prop || prop.ownerId !== proposerId) {
      return { isValid: false, reason: `Proposer no longer owns ${name}.` };
    }
    if (prop.houses > 0) {
      return { isValid: false, reason: `${name} has houses built on it.` };
    }
    if (prop.mortgaged) {
      return { isValid: false, reason: `${name} is currently mortgaged.` };
    }
    if (space?.group) {
      const groupHasHouses = Object.entries(properties).some(([idx, p]) => {
        const s = MONOPOLY_BOARD[parseInt(idx, 10)];
        return s.group === space.group && p.houses > 0;
      });
      if (groupHasHouses) {
        return { isValid: false, reason: `Houses are built on the ${space.group} color group for ${name}.` };
      }
    }
  }

  for (const spaceIndex of (request.properties || [])) {
    const prop = properties[spaceIndex];
    const space = MONOPOLY_BOARD[spaceIndex];
    const name = space?.name || `Property #${spaceIndex}`;

    if (!prop || prop.ownerId !== receiverId) {
      return { isValid: false, reason: `Recipient no longer owns ${name}.` };
    }
    if (prop.houses > 0) {
      return { isValid: false, reason: `${name} has houses built on it.` };
    }
    if (prop.mortgaged) {
      return { isValid: false, reason: `${name} is currently mortgaged.` };
    }
    if (space?.group) {
      const groupHasHouses = Object.entries(properties).some(([idx, p]) => {
        const s = MONOPOLY_BOARD[parseInt(idx, 10)];
        return s.group === space.group && p.houses > 0;
      });
      if (groupHasHouses) {
        return { isValid: false, reason: `Houses are built on the ${space.group} color group for ${name}.` };
      }
    }
  }

  return { isValid: true };
};

const renderPropertyBadges = (propIndices: number[]) => {
  if (!propIndices || propIndices.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>No properties</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
      {propIndices.map(idx => {
        const space = MONOPOLY_BOARD[idx];
        const color = space?.group ? (colorGroupMap[space.group] || '#7b2cbf') : '#e2af61';
        return (
          <span
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${color}88`,
              borderRadius: '6px',
              fontSize: '11px',
              color: '#fff'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
            {space?.name || `Property #${idx}`}
          </span>
        );
      })}
    </div>
  );
};

export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  room,
  currentUserId,
  targetPlayerId,
  initialRequestedProp,
  onCloseConstructor,
  onInitiateTrade,
  onCounterTrade,
  onAcceptTrade,
  onRejectTrade
}) => {
  // Constructor state
  const [offerCash, setOfferCash] = useState(0);
  const [offerProperties, setOfferProperties] = useState<number[]>([]);
  const [requestCash, setRequestCash] = useState(0);
  const [requestProperties, setRequestProperties] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Negotiation state
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [counterOfferCash, setCounterOfferCash] = useState(0);
  const [counterOfferProps, setCounterOfferProps] = useState<number[]>([]);
  const [counterRequestCash, setCounterRequestCash] = useState(0);
  const [counterRequestProps, setCounterRequestProps] = useState<number[]>([]);

  // Minimization state
  const [isMinimized, setIsMinimized] = useState(false);

  const activeTrade = gameState.gameSpecificState.activeTrade;
  const isProposerMe = activeTrade?.proposerId === currentUserId;
  const isReceiverMe = activeTrade?.receiverId === currentUserId;

  // Track trade changes to automatically un-minimize and reset negotiation on fresh proposals
  const tradeKey = activeTrade
    ? `${activeTrade.proposerId}->${activeTrade.receiverId}:${activeTrade.offer.cash}:${activeTrade.offer.properties.join(',')}:${activeTrade.request.cash}:${activeTrade.request.properties.join(',')}`
    : null;
  const lastTradeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (tradeKey && tradeKey !== lastTradeKeyRef.current) {
      lastTradeKeyRef.current = tradeKey;
      setIsMinimized(false);
      setIsNegotiating(false);
    } else if (!tradeKey) {
      lastTradeKeyRef.current = null;
      setIsNegotiating(false);
    }
  }, [tradeKey]);

  // Pre-seed requested property when opened from PropertyDetailModal
  useEffect(() => {
    if (targetPlayerId && typeof initialRequestedProp === 'number') {
      setRequestProperties([initialRequestedProp]);
    } else if (targetPlayerId) {
      setRequestProperties([]);
    }
  }, [targetPlayerId, initialRequestedProp]);

  // Initialize negotiation state when entering negotiation mode
  const startNegotiating = () => {
    if (!activeTrade) return;
    // Invert sides: recipient now offers what was requested from them, and requests what was offered to them
    setCounterOfferCash(activeTrade.request.cash || 0);
    setCounterOfferProps([...(activeTrade.request.properties || [])]);
    setCounterRequestCash(activeTrade.offer.cash || 0);
    setCounterRequestProps([...(activeTrade.offer.properties || [])]);
    setValidationError(null);
    setIsNegotiating(true);
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeTradeRef = useRef(activeTrade);
  const onCloseConstructorRef = useRef(onCloseConstructor);
  activeTradeRef.current = activeTrade;
  onCloseConstructorRef.current = onCloseConstructor;

  const dialogOpen = !isMinimized && (!!activeTrade || !!targetPlayerId);

  useEffect(() => {
    if (!dialogOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (activeTradeRef.current) {
          setIsMinimized(true);
        } else {
          onCloseConstructorRef.current();
        }
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [dialogOpen]);

  // Evaluate current condition match
  const conditionCheck = activeTrade ? checkTradeConditions(activeTrade, gameState) : { isValid: true };

  // --- 1. RENDER MINIMIZED FLOATING DOCK (When trade is active and minimized) ---
  if (activeTrade && isMinimized) {
    const proposer = room?.players?.find(p => p.id === activeTrade.proposerId);
    const receiver = room?.players?.find(p => p.id === activeTrade.receiverId);
    const proposerName = proposer?.name || 'Player';
    const receiverName = receiver?.name || 'Player';

    const offerSummary = `$${activeTrade.offer.cash}${activeTrade.offer.properties.length > 0 ? ` + ${activeTrade.offer.properties.length} props` : ''}`;
    const requestSummary = `$${activeTrade.request.cash}${activeTrade.request.properties.length > 0 ? ` + ${activeTrade.request.properties.length} props` : ''}`;

    return (
      <aside className="monopoly-trade-minimized-pill" role="region" aria-label="Minimized trade deal">
        <button
          type="button"
          className="monopoly-trade-pill-main"
          onClick={() => setIsMinimized(false)}
          title="Click to review full trade deal"
        >
          <div className="monopoly-trade-pill-badge">
            <Handshake size={14} className="monopoly-trade-icon-pulse" />
            <span>TRADE</span>
          </div>

          <div className="monopoly-trade-pill-text">
            {isReceiverMe ? (
              <span>
                Deal from <strong>{proposerName}</strong>: Give {requestSummary} ⇄ Get {offerSummary}
              </span>
            ) : isProposerMe ? (
              <span>
                Deal to <strong>{receiverName}</strong>: Offering {offerSummary} ⇄ Requesting {requestSummary}
              </span>
            ) : (
              <span>
                <strong>{proposerName}</strong> ⇄ <strong>{receiverName}</strong> ({offerSummary} for {requestSummary})
              </span>
            )}
          </div>

          {!conditionCheck.isValid && (
            <span className="monopoly-trade-pill-warning" title={conditionCheck.reason}>
              <AlertTriangle size={12} /> Stale
            </span>
          )}
        </button>

        <div className="monopoly-trade-pill-actions">
          {isReceiverMe ? (
            <>
              <button
                type="button"
                onClick={onAcceptTrade}
                disabled={!conditionCheck.isValid}
                className="monopoly-trade-pill-btn is-accept"
                title={!conditionCheck.isValid ? conditionCheck.reason : 'Accept trade'}
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  startNegotiating();
                  setIsMinimized(false);
                }}
                className="monopoly-trade-pill-btn is-counter"
                title="Negotiate counter-offer"
              >
                <Scale size={13} />
              </button>
              <button
                type="button"
                onClick={onRejectTrade}
                className="monopoly-trade-pill-btn is-decline"
                title="Decline trade"
              >
                <X size={13} />
              </button>
            </>
          ) : isProposerMe ? (
            <>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="monopoly-trade-pill-btn is-view"
                title="View deal"
              >
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                onClick={onRejectTrade}
                className="monopoly-trade-pill-btn is-decline"
                title="Cancel proposal"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="monopoly-trade-pill-btn is-view"
              title="View full trade details"
            >
              <Eye size={13} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // --- 2. RENDER ACTIVE TRADE VIEW (Full Overlay with Minimize, Negotiate, Accept, Decline) ---
  if (activeTrade && !isMinimized) {
    const proposer = room?.players?.find(p => p.id === activeTrade.proposerId);
    const receiver = room?.players?.find(p => p.id === activeTrade.receiverId);
    const proposerName = proposer?.name || 'Unknown';
    const receiverName = receiver?.name || 'Unknown';

    const properties = gameState.gameSpecificState.properties || {};
    const cashMap = gameState.gameSpecificState.cash || {};
    const myCash = cashMap[currentUserId] || 0;
    const targetPlayerIdForCounter = activeTrade.proposerId;
    const targetCashForCounter = cashMap[targetPlayerIdForCounter] || 0;

    // Properties for counter-offer builder
    const myTradeableProps = Object.keys(properties)
      .map(k => parseInt(k, 10))
      .filter(idx => isTradeableProperty(properties, idx, currentUserId))
      .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx]?.name || `Property #${idx}` }));

    const targetTradeableProps = Object.keys(properties)
      .map(k => parseInt(k, 10))
      .filter(idx => isTradeableProperty(properties, idx, targetPlayerIdForCounter))
      .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx]?.name || `Property #${idx}` }));

    const handleSendCounterOffer = () => {
      if (counterOfferCash > myCash) {
        setValidationError('You cannot offer more cash than you currently have.');
        return;
      }
      if (counterRequestCash > targetCashForCounter) {
        setValidationError('You cannot request more cash than target player has.');
        return;
      }
      setValidationError(null);
      if (onCounterTrade) {
        onCounterTrade(
          { cash: counterOfferCash, properties: counterOfferProps },
          { cash: counterRequestCash, properties: counterRequestProps }
        );
      } else {
        // Fallback to onInitiateTrade if onCounterTrade isn't provided
        onInitiateTrade(
          targetPlayerIdForCounter,
          { cash: counterOfferCash, properties: counterOfferProps },
          { cash: counterRequestCash, properties: counterRequestProps }
        );
      }
      setIsNegotiating(false);
    };

    return (
      <div
        ref={dialogRef}
        className="monopoly-trade-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Monopoly Trade Deal"
      >
        <div className="glass-panel monopoly-trade-card">
          {/* Header */}
          <div className="monopoly-trade-card-header">
            <span className="monopoly-trade-card-title">
              <Handshake size={15} /> Monopoly Trade Deal
            </span>
            <div className="monopoly-trade-card-header-actions">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="monopoly-trade-header-btn"
                title="Minimize trade to get back to the board"
                aria-label="Minimize trade"
              >
                <Minus size={15} />
              </button>
            </div>
          </div>

          {/* Negotiating Mode View */}
          {isNegotiating && isReceiverMe ? (
            <div className="monopoly-trade-counter-section">
              <div className="monopoly-trade-counter-banner">
                <Scale size={14} />
                <span>Negotiating Counter-Offer to <strong>{proposerName}</strong></span>
              </div>

              {validationError && (
                <div className="monopoly-trade-alert is-warning" style={{ margin: '10px 0' }}>
                  <AlertTriangle size={14} />
                  <span>{validationError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
                {/* You Give (Counter Offer) */}
                <div style={{ padding: '10px', background: 'rgba(56,176,0,0.04)', border: '1px solid rgba(56,176,0,0.18)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    You Give
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${myCash})</label>
                    <input
                      type="number"
                      min={0}
                      max={myCash}
                      value={counterOfferCash}
                      onChange={e => setCounterOfferCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {myTradeableProps.length === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No properties</span>
                      ) : (
                        myTradeableProps.map(p => (
                          <label key={p.index} style={{ fontSize: '11.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={counterOfferProps.includes(p.index)}
                              onChange={() =>
                                setCounterOfferProps(prev =>
                                  prev.includes(p.index) ? prev.filter(x => x !== p.index) : [...prev, p.index]
                                )
                              }
                            />
                            {p.name}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* You Receive (Counter Request) */}
                <div style={{ padding: '10px', background: 'rgba(217,4,41,0.04)', border: '1px solid rgba(217,4,41,0.18)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-pink)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    You Receive
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash (Max: ${targetCashForCounter})</label>
                    <input
                      type="number"
                      min={0}
                      max={targetCashForCounter}
                      value={counterRequestCash}
                      onChange={e => setCounterRequestCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Properties</label>
                    <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {targetTradeableProps.length === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No properties</span>
                      ) : (
                        targetTradeableProps.map(p => (
                          <label key={p.index} style={{ fontSize: '11.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={counterRequestProps.includes(p.index)}
                              onChange={() =>
                                setCounterRequestProps(prev =>
                                  prev.includes(p.index) ? prev.filter(x => x !== p.index) : [...prev, p.index]
                                )
                              }
                            />
                            {p.name}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={handleSendCounterOffer}
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Rocket size={14} /> Send Counter-Offer
                </button>
                <button
                  type="button"
                  onClick={() => setIsNegotiating(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '9px' }}
                >
                  Back to Offer
                </button>
              </div>
            </div>
          ) : (
            /* Proposal Details View */
            <>
              {/* Participants Banner */}
              <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Proposer</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: isProposerMe ? 'var(--accent-green)' : '#fff' }}>
                    {proposerName} {isProposerMe && '(You)'}
                  </div>
                </div>
                <ArrowLeftRight size={15} style={{ color: 'var(--accent-gold)', opacity: 0.8 }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recipient</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: isReceiverMe ? 'var(--accent-green)' : '#fff' }}>
                    {receiverName} {isReceiverMe && '(You)'}
                  </div>
                </div>
              </div>

              {/* Condition Mismatch Alert */}
              {!conditionCheck.isValid && (
                <div className="monopoly-trade-alert is-warning" role="alert">
                  <AlertTriangle size={15} />
                  <div>
                    <strong>Conditions have changed:</strong> {conditionCheck.reason}
                  </div>
                </div>
              )}

              {/* Offer & Request Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', margin: '12px 0' }}>
                <div style={{ padding: '10px', background: 'rgba(56,176,0,0.04)', borderRadius: '8px', border: '1px solid rgba(56,176,0,0.14)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-green)', fontSize: '12.5px' }}>
                      {isReceiverMe ? 'You Receive:' : `${proposerName} Offers:`}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                      ${activeTrade.offer.cash}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    {renderPropertyBadges(activeTrade.offer.properties)}
                  </div>
                </div>

                <div style={{ padding: '10px', background: 'rgba(217,4,41,0.04)', borderRadius: '8px', border: '1px solid rgba(217,4,41,0.14)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)', fontSize: '12.5px' }}>
                      {isReceiverMe ? 'You Give:' : `${proposerName} Requests:`}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                      ${activeTrade.request.cash}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    {renderPropertyBadges(activeTrade.request.properties)}
                  </div>
                </div>
              </div>

              {/* Actions depending on role */}
              {isReceiverMe ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onAcceptTrade}
                      disabled={!conditionCheck.isValid}
                      className="btn-primary"
                      style={{
                        flex: 1.2,
                        padding: '10px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        background: conditionCheck.isValid
                          ? 'linear-gradient(135deg, var(--accent-green) 0%, #2b8c00 100%)'
                          : 'rgba(255,255,255,0.08)',
                        cursor: conditionCheck.isValid ? 'pointer' : 'not-allowed',
                        opacity: conditionCheck.isValid ? 1 : 0.45
                      }}
                      title={!conditionCheck.isValid ? conditionCheck.reason : 'Accept trade offer'}
                    >
                      <Check size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Accept
                    </button>

                    <button
                      type="button"
                      onClick={startNegotiating}
                      className="btn-secondary"
                      style={{ flex: 1.2, padding: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      title="Propose adjusted counter-offer"
                    >
                      <Scale size={14} /> Negotiate
                    </button>

                    <button
                      type="button"
                      onClick={onRejectTrade}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '10px', fontSize: '13px', color: 'var(--accent-pink)' }}
                      title="Decline this trade offer"
                    >
                      Decline
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="monopoly-trade-minimize-text-btn"
                  >
                    Minimize &amp; Decide Later
                  </button>
                </div>
              ) : isProposerMe ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                    Waiting for {receiverName} to accept, negotiate, or decline…
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onRejectTrade}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                    >
                      Cancel Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                    >
                      Minimize
                    </button>
                  </div>
                </div>
              ) : (
                /* Non-Participant (Shown to All) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                    Live Negotiation: Waiting for {receiverName}&apos;s decision…
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="btn-secondary"
                    style={{ padding: '8px', fontSize: '12.5px' }}
                  >
                    Minimize
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- 3. CONSTRUCTOR VIEW: Propose a new trade (can be opened out-of-turn) ---
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
    .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx]?.name || `Property #${idx}` }));

  const targetTradeableProps = Object.keys(properties)
    .map(k => parseInt(k, 10))
    .filter(idx => isTradeableProperty(properties, idx, targetPlayerId))
    .map(idx => ({ index: idx, name: MONOPOLY_BOARD[idx]?.name || `Property #${idx}` }));

  const toggleOfferProperty = (idx: number) => {
    setOfferProperties(prev => (prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]));
  };

  const toggleRequestProperty = (idx: number) => {
    setRequestProperties(prev => (prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]));
  };

  const handleSendOffer = () => {
    if (offerCash > myCash) {
      setValidationError('You cannot offer more cash than you currently have.');
      return;
    }
    if (requestCash > targetCash) {
      setValidationError('You cannot request more cash than target player has.');
      return;
    }
    setValidationError(null);
    onInitiateTrade(
      targetPlayerId,
      { cash: offerCash, properties: offerProperties },
      { cash: requestCash, properties: requestProperties }
    );
    setOfferCash(0);
    setOfferProperties([]);
    setRequestCash(0);
    setRequestProperties([]);
  };

  return (
    <div
      ref={dialogRef}
      className="monopoly-trade-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Propose a trade with ${targetPlayer.name}`}
    >
      <div className="glass-panel monopoly-trade-card monopoly-trade-builder">
        <div className="monopoly-trade-card-header">
          <span className="monopoly-trade-card-title">
            <Handshake size={16} /> Propose Deal to {targetPlayer.name}
          </span>
          <button
            type="button"
            onClick={onCloseConstructor}
            className="monopoly-trade-header-btn"
            title="Cancel"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {validationError && (
          <div className="monopoly-trade-alert is-warning">
            <AlertTriangle size={14} />
            <span>{validationError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '14px 0' }}>
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
                ) : (
                  myTradeableProps.map(p => (
                    <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={offerProperties.includes(p.index)} onChange={() => toggleOfferProperty(p.index)} />
                      {p.name}
                    </label>
                  ))
                )}
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
                ) : (
                  targetTradeableProps.map(p => (
                    <label key={p.index} style={{ fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={requestProperties.includes(p.index)} onChange={() => toggleRequestProperty(p.index)} />
                      {p.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleSendOffer}
            className="btn-primary"
            style={{ flex: 1.5, padding: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Rocket size={14} /> Send Deal
          </button>
          <button type="button" onClick={onCloseConstructor} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
