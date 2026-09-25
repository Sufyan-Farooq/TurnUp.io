import React, { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Shared 3D dice component extracted from App.tsx (was previously defined
 * inline near the top of that file). Used by Snakes & Ladders, Ludo, and
 * (potentially) Monopoly/Uno action bars.
 *
 * The spin runs until an authoritative roll arrives. On completion we capture
 * its exact on-screen orientation and ease into the final face without a snap.
 */

export interface Dice3DProps {
  value: number;
  isRolling: boolean;
  onClick?: () => void;
  size?: number;
}

const DOT_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

export const renderDiceDots = (value: number, size = 60) => {
  const activeDots = DOT_POSITIONS[value] || [];
  const containerSize = size * 0.6;
  const dotSize = size * 0.14;
  const gap = size * 0.06;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      width: `${containerSize}px`,
      height: `${containerSize}px`,
      gap: `${gap}px`,
      padding: `${gap}px`,
      boxSizing: 'border-box'
    }}>
      {Array.from({ length: 9 }, (_, idx) => {
        const isActive = activeDots.includes(idx);
        return (
          <div
            key={idx}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              backgroundColor: isActive ? '#181818' : 'transparent',
              boxShadow: isActive ? 'inset 0 1px 2px rgba(0,0,0,0.6)' : 'none',
              transition: 'background-color 0.2s'
            }}
          />
        );
      })}
    </div>
  );
};

export const getDiceTransform = (val: number) => {
  switch (val) {
    case 1: return 'rotateX(0deg) rotateY(0deg)';
    case 2: return 'rotateX(0deg) rotateY(-90deg)';
    case 3: return 'rotateX(0deg) rotateY(-180deg)';
    case 4: return 'rotateX(0deg) rotateY(90deg)';
    case 5: return 'rotateX(-90deg) rotateY(0deg)';
    case 6: return 'rotateX(90deg) rotateY(0deg)';
    default: return 'rotateX(-15deg) rotateY(45deg)';
  }
};

export const Dice3D: React.FC<Dice3DProps> = ({ value, isRolling, onClick, size = 60 }) => {
  const half = size / 2;
  const dieRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Animation | null>(null);
  const wasRollingRef = useRef(false);

  useLayoutEffect(() => {
    const die = dieRef.current;
    if (!die) return;
    const target = getDiceTransform(value);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isRolling && !wasRollingRef.current) {
      motionRef.current?.cancel();
      die.style.transform = target;
      die.style.rotate = 'none';
      if (!reduceMotion) {
        motionRef.current = die.animate([
          { rotate: '1 1 0 0deg' },
          { rotate: '1 1 0 720deg' }
        ], { duration: 820, iterations: Infinity, easing: 'linear' });
      }
    } else if (!isRolling && wasRollingRef.current) {
      const orientation = getComputedStyle(die);
      const currentTransform = orientation.transform;
      const currentRotate = orientation.rotate;
      motionRef.current?.cancel();
      die.style.transform = currentTransform;
      die.style.rotate = currentRotate;
      if (reduceMotion) {
        die.style.transform = target;
        die.style.rotate = 'none';
      } else {
        const settle = die.animate([
          { transform: currentTransform, rotate: currentRotate },
          { transform: target, rotate: 'none' }
        ], { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        motionRef.current = settle;
        settle.onfinish = () => {
          die.style.transform = target;
          die.style.rotate = 'none';
          motionRef.current = null;
        };
      }
    } else if (!isRolling && !motionRef.current) {
      die.style.transform = target;
      die.style.rotate = 'none';
    }
    wasRollingRef.current = isRolling;
  }, [isRolling, value]);

  useEffect(() => () => motionRef.current?.cancel(), []);

  return (
    <div className="dice-container" style={{ margin: `${size * 0.15}px`, perspective: `${size * 10}px` }}>
      <div
        ref={dieRef}
        className={`dice-3d ${isRolling ? 'dice-rolling' : ''}`}
        onClick={onClick}
        onKeyDown={(event) => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
          }
        }}
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick ? 0 : -1}
        aria-label={isRolling ? 'Dice rolling' : onClick ? `Roll dice, currently showing ${value}` : `Dice showing ${value}`}
        style={{
          width: `${size}px`,
          height: `${size}px`
        }}
      >
        <div className="dice-face face-1" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(0deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(1, size)}</div>
        <div className="dice-face face-2" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(2, size)}</div>
        <div className="dice-face face-3" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(180deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(3, size)}</div>
        <div className="dice-face face-4" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(-90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(4, size)}</div>
        <div className="dice-face face-5" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(5, size)}</div>
        <div className="dice-face face-6" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(-90deg) translateZ(${half}px)`, borderRadius: `${size * 0.2}px` }}>{renderDiceDots(6, size)}</div>
      </div>
    </div>
  );
};

export default Dice3D;
