import React, { useRef, useEffect, useState } from 'react';

interface BoardWrapperProps {
  children: React.ReactNode;
  /** Logical dimensions of the board being scaled. */
  virtualWidth?: number;
  virtualHeight?: number;
  /** Breathing room between the board and the available viewport. */
  padding?: number;
}

export const BoardWrapper: React.FC<BoardWrapperProps> = ({
  children,
  virtualWidth = 1000,
  virtualHeight = 1000,
  padding = 12,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeBoard = () => {
      const wAvail = Math.max(1, container.clientWidth - padding * 2);
      const hAvail = Math.max(1, container.clientHeight - padding * 2);
      const calculatedScale = Math.min(wAvail / virtualWidth, hAvail / virtualHeight);
      setScale(Math.max(0.08, calculatedScale));
    };

    resizeBoard();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resizeBoard)
      : null;
    observer?.observe(container);
    window.addEventListener('resize', resizeBoard);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resizeBoard);
    };
  }, [padding, virtualHeight, virtualWidth]);

  return (
    <div 
      ref={containerRef} 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 42%, #241638 0%, #130f1d 58%, #0b0811 100%)'
      }}
    >
      <div 
        style={{
          width: `${virtualWidth}px`,
          height: `${virtualHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          willChange: 'transform',
          position: 'absolute',
          boxShadow: '0 24px 70px rgba(5, 2, 12, 0.55)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
