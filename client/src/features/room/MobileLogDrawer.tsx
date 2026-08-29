import React from 'react';
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
  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sliding-drawer ${isOpen ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(123,44,191,0.1)' }}>
          <h3 style={{ margin: 0 }}>Game Info & Log</h3>
          <Button variant="secondary" onClick={onClose} style={{ padding: '4px 10px', fontSize: '12px' }}>
            Close
          </Button>
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
      </div>
    </>
  );
};

export default MobileLogDrawer;
