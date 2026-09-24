import React from 'react';
import { Activity, Radio } from 'lucide-react';
import { getLogStyles } from './gameLog';

export interface GameLogPanelProps {
  gameLog: string[];
}

/**
 * Desktop sidebar game log (the "Log" section of the right-hand panel).
 * Extracted from App.tsx's inline log block; the mobile equivalent is
 * `MobileLogDrawer`.
 */
export const GameLogPanel: React.FC<GameLogPanelProps> = ({ gameLog }) => (
  <section className="game-feed" aria-labelledby="game-feed-title" aria-live="polite">
    <div className="game-feed__header">
      <div>
        <h3 id="game-feed-title"><Activity size={15} /> Match feed</h3>
        <p>Live actions and turning points</p>
      </div>
      <Radio size={15} className="game-feed__live" aria-label="Live" />
    </div>
    <div className="game-feed__list">
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
  </section>
);

export default GameLogPanel;
