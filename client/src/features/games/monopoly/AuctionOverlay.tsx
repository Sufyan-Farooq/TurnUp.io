import React from 'react';
import { Gavel } from 'lucide-react';
import { MONOPOLY_BOARD } from './boardData';
import type { MonopolyGameState, MonopolyRoom } from './types';

export interface AuctionOverlayProps {
  gameState: MonopolyGameState;
  room: MonopolyRoom;
  currentUserId: string;
  onBid: (amount: number) => void;
  onFold: () => void;
}

const BID_INCREMENT = 10;

/**
 * Sequential bid/fold overlay shown while `subState === 'AUCTION'`.
 * Renders null when there's no active auction space.
 */
export const AuctionOverlay: React.FC<AuctionOverlayProps> = ({ gameState, room, currentUserId, onBid, onFold }) => {
  if (gameState.subState !== 'AUCTION') return null;

  const { auctionSpaceIndex, auctionCurrentBid = 0, auctionHighestBidderId, auctionBidders = [], auctionActiveBidderIndex = 0 } = gameState.gameSpecificState;

  if (auctionSpaceIndex === undefined) return null;

  const space = MONOPOLY_BOARD[auctionSpaceIndex];
  const activeBidderId = auctionBidders[auctionActiveBidderIndex];
  const isActiveBidderMe = activeBidderId === currentUserId;
  const nextBid = auctionCurrentBid + BID_INCREMENT;
  const availableCash = gameState.gameSpecificState.cash[currentUserId] ?? 0;
  const canAffordBid = availableCash >= nextBid;

  const activeBidderName = room?.players?.find(p => p.id === activeBidderId)?.name || 'Unknown';
  const highestBidderName = auctionHighestBidderId ? (room?.players?.find(p => p.id === auctionHighestBidderId)?.name || 'Unknown') : 'No bids yet';

  const colorGroupHex = space.group === 'brown' ? '#955436' :
    space.group === 'light-blue' ? '#aae0fa' :
    space.group === 'magenta' ? '#d93b96' :
    space.group === 'orange' ? '#f7941d' :
    space.group === 'red' ? '#ed1c24' :
    space.group === 'yellow' ? '#fef200' :
    space.group === 'green' ? '#1fb25a' :
    space.group === 'dark-blue' ? '#0072bc' : '#9aa0a6';

  return (
    <div style={{
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
      <div className="glass-panel" style={{
        width: '320px',
        padding: '20px',
        borderRadius: '12px',
        border: '1.5px solid var(--accent-purple)',
        background: 'rgba(123,44,191,0.05)',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Gavel size={13} /> Property Auction
        </span>

        <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ height: '14px', background: colorGroupHex }} />
          <div style={{ padding: '12px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{space.name}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Valued at ${space.price}</span>
          </div>
        </div>

        <div style={{ margin: '16px 0', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Highest Bid</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-green)', margin: '4px 0' }}>
            ${auctionCurrentBid}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            by <strong>{highestBidderName}</strong>
          </div>
        </div>

        <div style={{ margin: '14px 0', fontSize: '13px' }}>
          {isActiveBidderMe ? (
            <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              Your Turn to Bid!
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>
              Turn: <strong>{activeBidderName}</strong>
            </div>
          )}
        </div>

        {isActiveBidderMe ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => onBid(nextBid)}
              disabled={!canAffordBid}
              className="btn-primary"
              style={{ padding: '10px', fontWeight: 'bold', fontSize: '13px', background: 'linear-gradient(135deg, var(--accent-gold) 0%, #e89b00 100%)', boxShadow: '0 4px 15px rgba(255,183,3,0.3)' }}
            >
              {canAffordBid ? `Bid $${nextBid}` : `Need $${nextBid} to bid`}
            </button>
            <button onClick={onFold} className="btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
              Fold / Pass
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            Waiting for bids...
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionOverlay;
