import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, type LucideIcon } from 'lucide-react';

const DICE_ICONS: LucideIcon[] = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export interface DiceDisplayProps {
  value: number; // 1-6
  size?: number;
  rolling?: boolean;
  onClick?: () => void;
}

/** Single die face, rendered with lucide-react icons instead of a 3D CSS cube / emoji. */
export const DiceDisplay: React.FC<DiceDisplayProps> = ({ value, size = 48, rolling = false, onClick }) => {
  const clamped = Math.min(6, Math.max(1, value || 1));
  const Icon = DICE_ICONS[clamped - 1];
  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={onClick ? `Roll dice, currently showing ${clamped}` : `Dice showing ${clamped}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size * 0.2,
        background: '#fff',
        color: '#1a1a2e',
        boxShadow: rolling ? '0 0 20px var(--accent-gold)' : '0 4px 12px rgba(0,0,0,0.35)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
        transform: rolling ? 'rotate(8deg)' : 'none'
      }}
    >
      <Icon size={size * 0.7} strokeWidth={1.75} />
    </div>
  );
};

/**
 * Drives the ~800ms "shuffling dice" animation locally (matching the original
 * App.tsx handleRollDice behavior) before invoking the actual onRollDice action
 * callback. Kept local so MonopolyBoard/MonopolyActionBar don't need extra
 * roll-animation props beyond the plain `onRollDice()` handler.
 */
export function useRollAnimation(onRollDice: () => void, durationMs = 800, intervalMs = 70) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 4]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollingRef = useRef(false);
  const onRollDiceRef = useRef(onRollDice);

  useEffect(() => {
    onRollDiceRef.current = onRollDice;
  }, [onRollDice]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    rollingRef.current = false;
  }, []);

  const triggerRoll = useCallback(() => {
    // A ref closes the same-render double-click window before React commits.
    if (rollingRef.current) return;
    rollingRef.current = true;
    setIsRolling(true);
    intervalRef.current = setInterval(() => {
      setDiceValues([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
    }, intervalMs);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      timeoutRef.current = null;
      rollingRef.current = false;
      setIsRolling(false);
      onRollDiceRef.current();
    }, durationMs);
  }, [durationMs, intervalMs]);

  return { isRolling, diceValues, triggerRoll };
}

export default DiceDisplay;
