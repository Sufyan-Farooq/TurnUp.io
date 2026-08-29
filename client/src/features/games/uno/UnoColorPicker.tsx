import React from 'react';
import type { UnoColor } from './uno.types';

export interface UnoColorPickerProps {
  /** Whether the wild-card color picker should be shown. */
  isOpen: boolean;
  /** Called with the chosen color once the player picks one. */
  onSelectColor: (color: UnoColor) => void;
}

/**
 * Wild-card color-choice modal.
 *
 * NOTE: the shared `Modal` component (`client/src/components/ui/Modal`) does not
 * exist in this worktree yet (it is being built by a parallel agent). To keep this
 * slice self-contained and typecheck-clean today, this reuses the pre-existing
 * global `.color-picker-overlay` / `.color-picker-modal` / `.color-btn` classes
 * from `client/src/index.css` (the exact classes the original App.tsx modal used).
 * Once the shared `Modal` primitive lands, this can be swapped to wrap its content
 * in `<Modal>` instead — the `isOpen` / callback-only prop shape here was chosen to
 * make that swap a drop-in change.
 */
export const UnoColorPicker: React.FC<UnoColorPickerProps> = ({ isOpen, onSelectColor }) => {
  if (!isOpen) return null;

  return (
    <div className="color-picker-overlay">
      <div className="color-picker-modal">
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>Select Wild Card Color</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Choose the color to set for the next turn.
        </p>
        <div className="color-options">
          <button className="color-btn btn-red" onClick={() => onSelectColor('red')}>Red</button>
          <button className="color-btn btn-green" onClick={() => onSelectColor('green')}>Green</button>
          <button className="color-btn btn-blue" onClick={() => onSelectColor('blue')}>Blue</button>
          <button className="color-btn btn-yellow" onClick={() => onSelectColor('yellow')}>Yellow</button>
        </div>
      </div>
    </div>
  );
};

export default UnoColorPicker;
