import React, { useEffect } from 'react';
import { Activity, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface MobileLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gameLog: string[];
  /**
   * Computes the (borderLeft, background) inline style for a log line based
   * on its content (win/loss/jail/etc keyword matching). Parent passes the
   * existing `getLogStyles` helper from App.tsx so styling stays identical.
   */
  getLogStyles: (log: string) => { borderLeft: string; background: string };
}

/**
 * Extracted from App.tsx's mobile sliding drawer block (~line 5181). Shows
 * the full game log in a slide-over panel on small screens.
 */
export const MobileLogDrawer: React.FC<MobileLogDrawerProps> = ({ isOpen, onClose, gameLog, getLogStyles }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Do not leave controls from the off-canvas drawer in the tab order or
  // accessibility tree while it is visually closed.
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay active" onClick={onClose} aria-hidden="true" />
      <div
        className="sliding-drawer active"
        role="dialog"
        aria-modal="true"
        aria-label="Match feed"
      >
        <div className="mobile-feed__header">
          <div><h3><Activity size={17} /> Match feed</h3><p>Every move, in order</p></div>
          <Button variant="ghost" onClick={onClose} className="mobile-feed__close" aria-label="Close match feed">
            <X size={18} />
          </Button>
        </div>

        <div className="game-feed__list mobile-feed__list">
          {gameLog.length === 0 && <div className="game-feed__empty">Actions will appear here once the match begins.</div>}
          {gameLog.map((log, index) => {
            const styles = getLogStyles(log);
            const accent = styles.borderLeft.split('solid ')[1] || 'var(--accent-blue)';
            return (
              <div
                key={index}
                className="game-feed__event"
                style={{ '--event-accent': accent, background: styles.background } as React.CSSProperties}
              >
                <span className="game-feed__dot" aria-hidden="true" />
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileLogDrawer;
