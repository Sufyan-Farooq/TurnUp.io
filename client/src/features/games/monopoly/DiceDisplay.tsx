import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, type LucideIcon } from 'lucide-react';
import './monopoly.css';

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
          [{ rotate: '-9deg' }, { rotate: '9deg' }],
          { duration: 390, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
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
      aria-label={rolling ? 'Dice rolling' : onClick ? `Roll dice, currently showing ${clamped}` : `Dice showing ${clamped}`}
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
        transform: 'none'
      }}
    >
      <Icon key={clamped} size={size * 0.7} strokeWidth={1.75} />
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
  const [diceValues, setDiceValues] = useState<[number, number]>(finalRoll?.[0] ? finalRoll : [3, 4]);
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
