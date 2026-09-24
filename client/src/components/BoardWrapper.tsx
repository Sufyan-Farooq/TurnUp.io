import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';

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
  const [viewport, setViewport] = useState({ width: 1, height: 1, scale: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeBoard = () => {
      const wAvail = Math.max(1, container.clientWidth - padding * 2);
      const hAvail = Math.max(1, container.clientHeight - padding * 2);
      const calculatedScale = Math.min(wAvail / virtualWidth, hAvail / virtualHeight);
      const minimumReadableScale = window.matchMedia('(max-width: 900px)').matches ? 0.72 : 0.08;
      setViewport({
        width: container.clientWidth,
        height: container.clientHeight,
        scale: Math.min(1, Math.max(minimumReadableScale, calculatedScale)),
      });
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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      left: Math.max(0, (container.scrollWidth - container.clientWidth) / 2),
      top: Math.max(0, (container.scrollHeight - container.clientHeight) / 2),
    });
  }, [viewport]);

  const renderedWidth = virtualWidth * viewport.scale;
  const renderedHeight = virtualHeight * viewport.scale;
  const panWidth = Math.max(viewport.width, renderedWidth + padding * 2);
  const panHeight = Math.max(viewport.height, renderedHeight + padding * 2);

  return (
    <div 
      ref={containerRef} 
      className="board-stage"
      tabIndex={0}
      aria-label="Game board. Scroll in any direction to explore the full board."
    >
      <div
        className="board-stage__pan"
        style={{
          width: `${panWidth}px`,
          height: `${panHeight}px`,
        }}
      >
        <div
          className="board-stage__canvas"
          style={{
            width: `${virtualWidth}px`,
            height: `${virtualHeight}px`,
            left: `${(panWidth - renderedWidth) / 2}px`,
            top: `${(panHeight - renderedHeight) / 2}px`,
            transform: `scale(${viewport.scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
