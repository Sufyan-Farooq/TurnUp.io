import React, { useEffect, useRef } from 'react';
import type { UnoColor } from './uno.types';

export interface UnoColorPickerProps {
  /** Whether the wild-card color picker should be shown. */
  isOpen: boolean;
  /** Called with the chosen color once the player picks one. */
  onSelectColor: (color: UnoColor) => void;
  /** Cancels the pending wild-card play when the flow allows cancellation. */
  onCancel?: () => void;
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
export const UnoColorPicker: React.FC<UnoColorPickerProps> = ({ isOpen, onSelectColor, onCancel }) => {
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstOptionRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && cancelRef.current) {
        event.preventDefault();
        cancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="color-picker-overlay uno-color-picker-overlay" role="presentation">
      <div ref={dialogRef} className="color-picker-modal uno-color-picker" role="dialog" aria-modal="true" aria-labelledby="uno-color-picker-title" aria-describedby="uno-color-picker-description">
        <h2 id="uno-color-picker-title">Choose the next color</h2>
        <p id="uno-color-picker-description">
          This color stays active until another card changes it.
        </p>
        <div className="color-options" role="group" aria-label="Available colors">
          <button ref={firstOptionRef} type="button" className="color-btn btn-red" onClick={() => onSelectColor('red')}><span aria-hidden="true" />Red</button>
          <button type="button" className="color-btn btn-green" onClick={() => onSelectColor('green')}><span aria-hidden="true" />Green</button>
          <button type="button" className="color-btn btn-blue" onClick={() => onSelectColor('blue')}><span aria-hidden="true" />Blue</button>
          <button type="button" className="color-btn btn-yellow" onClick={() => onSelectColor('yellow')}><span aria-hidden="true" />Yellow</button>
        </div>
      </div>
    </div>
  );
};

export default UnoColorPicker;
