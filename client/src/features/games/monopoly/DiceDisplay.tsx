import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, type LucideIcon } from 'lucide-react';
import './monopoly.css';

const DICE_ICONS: LucideIcon[] = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export interface DiceDisplayProps {
  value: number; // 1-6; 0 or unset falls back to fallbackValue
  fallbackValue?: number;
  size?: number;
  rolling?: boolean;
  onClick?: () => void;
}

/** Single die face, rendered with lucide-react icons instead of a 3D CSS cube / emoji. */
export const DiceDisplay: React.FC<DiceDisplayProps> = ({ value, fallbackValue = 1, size = 48, rolling = false, onClick }) => {
  const face = Number.isInteger(value) && value >= 1 && value <= 6 ? value : fallbackValue;
  const Icon = DICE_ICONS[Math.max(0, Math.min(5, face - 1))];
  const dieRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Animation | null>(null);
  const wasRollingRef = useRef(false);

  useLayoutEffect(() => {
    const die = dieRef.current;
    if (!die) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rolling && !wasRollingRef.current) {
      motionRef.current?.cancel();
      die.style.rotate = 'none';
      if (!reduceMotion) {
        motionRef.current = die.animate(
          [{ rotate: '-12deg', transform: 'scale(1.05)' }, { rotate: '12deg', transform: 'scale(0.95)' }],
          { duration: 220, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
        );
      }
    } else if (!rolling && wasRollingRef.current) {
      const angle = getComputedStyle(die).rotate;
      motionRef.current?.cancel();
      die.style.rotate = angle;
      if (reduceMotion) {
        die.style.rotate = 'none';
      } else {
        const settle = die.animate([{ rotate: angle }, { rotate: 'none' }],
          { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        motionRef.current = settle;
        settle.onfinish = () => {
          die.style.rotate = 'none';
          motionRef.current = null;
        };
      }
    }
    wasRollingRef.current = rolling;
  }, [rolling]);

  useEffect(() => () => motionRef.current?.cancel(), []);
  return (
    <div
      ref={dieRef}
      className={`monopoly-die${rolling ? ' is-rolling' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={rolling ? 'Dice rolling' : onClick ? `Roll dice, currently showing ${face}` : `Dice showing ${face}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size * 0.22,
        background: 'linear-gradient(145deg, #ffffff 0%, #f0f2f5 100%)',
        color: '#141e28',
        boxShadow: rolling
          ? '0 0 28px rgba(240, 188, 100, 0.65), inset 0 2px 4px rgba(255,255,255,0.9), 0 8px 24px rgba(0,0,0,0.45)'
          : '0 6px 20px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
        transform: 'none',
        userSelect: 'none'
      }}
    >
      <Icon key={face} size={size * 0.72} strokeWidth={2.2} />
    </div>
  );
};

/**
 * The server rolls immediately. The dice keep moving until its updated state
 * arrives, then reveal that result after a minimum readable roll duration.
 */
export function useRollAnimation(
  onRollDice: () => void,
  revision: number,
  finalRoll: [number, number] | undefined,
  durationMs = 720
) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number]>(
    finalRoll && finalRoll[0] > 0 && finalRoll[1] > 0 ? finalRoll : [3, 4]
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollingRef = useRef(false);
  const startedAtRef = useRef(0);
  const startedRevisionRef = useRef(revision);
  const onRollDiceRef = useRef(onRollDice);
  const finalDie1 = finalRoll?.[0];
  const finalDie2 = finalRoll?.[1];

  useEffect(() => {
    onRollDiceRef.current = onRollDice;
  }, [onRollDice]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    rollingRef.current = false;
  }, []);

  // Sync final values if not rolling
  useEffect(() => {
    if (!rollingRef.current && finalDie1 && finalDie2 && finalDie1 > 0 && finalDie2 > 0) {
      setDiceValues([finalDie1, finalDie2]);
    }
  }, [finalDie1, finalDie2]);

  // Active tumbling animation during roll
  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 70);
    return () => clearInterval(interval);
  }, [isRolling]);

  useEffect(() => {
    if (!rollingRef.current || revision <= startedRevisionRef.current || !finalDie1 || !finalDie2) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const remaining = Math.max(0, durationMs - (Date.now() - startedAtRef.current));
    timeoutRef.current = setTimeout(() => {
      setDiceValues([finalDie1, finalDie2]);
      setIsRolling(false);
      rollingRef.current = false;
      timeoutRef.current = null;
    }, remaining);
  }, [revision, finalDie1, finalDie2, durationMs]);

  const triggerRoll = useCallback(() => {
    // A ref closes the same-render double-click window before React commits.
    if (rollingRef.current) return;
    rollingRef.current = true;
    startedAtRef.current = Date.now();
    startedRevisionRef.current = revision;
    setIsRolling(true);
    onRollDiceRef.current();
    // A failed or lost roll must not leave the control permanently disabled.
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      rollingRef.current = false;
      setIsRolling(false);
    }, 5000);
  }, [revision]);

  return { isRolling, diceValues, triggerRoll };
}

export default DiceDisplay;
