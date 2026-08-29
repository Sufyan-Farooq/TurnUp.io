import React from 'react';
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
  <>
    <div style={{ padding: '16px', borderTop: '1px solid rgba(123,44,191,0.1)', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
      <h3 style={{ margin: 0 }}>Log</h3>
    </div>
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
      {gameLog.map((log, index) => {
        const styles = getLogStyles(log);
        return (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              background: styles.background,
              borderRadius: '6px',
              borderLeft: styles.borderLeft,
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              marginBottom: '4px',
            }}
          >
            {log}
          </div>
        );
      })}
    </div>
  </>
);

export default GameLogPanel;
