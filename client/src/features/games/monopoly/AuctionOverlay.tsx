import React, { useEffect, useRef } from 'react';
import { Gavel } from 'lucide-react';
import { MONOPOLY_BOARD, colorGroupMap } from './boardData';
import type { MonopolyGameState, MonopolyRoom } from './types';
import './monopoly.css';

export interface AuctionOverlayProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onBid: (amount: number) => void;
  onFold: () => void;
}

const BID_INCREMENT = 10;

export const AuctionOverlay: React.FC<AuctionOverlayProps> = ({ gameState, room, currentUserId, onBid, onFold }) => {
  const { auctionSpaceIndex, auctionCurrentBid = 0, auctionHighestBidderId, auctionBidders = [], auctionActiveBidderIndex = 0 } = gameState.gameSpecificState;
  const activeBidderId = auctionBidders[auctionActiveBidderIndex];
  const isActiveBidderMe = activeBidderId === currentUserId;
  const isOpen = gameState.subState === 'AUCTION' && auctionSpaceIndex !== undefined;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const foldRef = useRef(onFold);
  foldRef.current = onFold;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    const firstControl = focusable()[0];
    if (firstControl) firstControl.focus();
    else dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActiveBidderMe) {
        event.preventDefault();
        foldRef.current();
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
  }, [isOpen, isActiveBidderMe]);

  if (!isOpen || auctionSpaceIndex === undefined) return null;

  const space = MONOPOLY_BOARD[auctionSpaceIndex];
  const nextBid = auctionCurrentBid + BID_INCREMENT;
  const availableCash = gameState.gameSpecificState.cash[currentUserId] ?? 0;
  const canAffordBid = availableCash >= nextBid;
  const activeBidderName = room?.players?.find(player => player.id === activeBidderId)?.name || 'Unknown player';
  const highestBidderName = auctionHighestBidderId ? room?.players?.find(player => player.id === auctionHighestBidderId)?.name || 'Unknown player' : 'No bids yet';
  const propertyColor = colorGroupMap[space.group || ''] || '#7b2cbf';

  return (
    <div ref={dialogRef} className="monopoly-auction-overlay" role="dialog" aria-modal="true" aria-labelledby="monopoly-auction-title" tabIndex={-1}>
      <section className="monopoly-auction-card" style={{ '--property-color': propertyColor } as React.CSSProperties}>
        <header className="monopoly-auction-header">
          <span className="monopoly-auction-label"><Gavel size={14} /> Live auction</span>
          <span className="monopoly-auction-cash">Your cash · ${availableCash.toLocaleString()}</span>
        </header>
        <div className="monopoly-auction-property">
          <div className="monopoly-auction-band" />
          <div className="monopoly-auction-property-copy">
            <h3 id="monopoly-auction-title">{space.name}</h3>
            <p>Bank value ${space.price?.toLocaleString()}</p>
          </div>
        </div>
        <div className="monopoly-auction-bid" aria-live="polite">
          <span>Highest bid</span>
          <strong>${auctionCurrentBid.toLocaleString()}</strong>
          <p>{auctionHighestBidderId ? `Held by ${highestBidderName}` : highestBidderName}</p>
        </div>
        <div className={`monopoly-auction-turn${isActiveBidderMe ? ' is-mine' : ''}`}>
          {isActiveBidderMe ? 'Your decision' : `${activeBidderName} is deciding`}
        </div>
        {isActiveBidderMe ? (
          <div className="monopoly-auction-actions">
            <button type="button" onClick={() => onBid(nextBid)} disabled={!canAffordBid} className="btn-primary">
              {canAffordBid ? `Bid $${nextBid}` : `Need $${nextBid}`}
            </button>
            <button type="button" onClick={onFold} className="btn-secondary">Fold</button>
          </div>
        ) : <div className="monopoly-auction-wait">Waiting for the next bid…</div>}
      </section>
    </div>
  );
};

export default AuctionOverlay;
