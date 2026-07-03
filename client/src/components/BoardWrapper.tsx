import React, { useRef, useEffect, useState } from 'react';

interface BoardWrapperProps {
  children: React.ReactNode;
}

export const BoardWrapper: React.FC<BoardWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  const resizeBoard = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Subtracted margins to account for screen corners and spacing
    const margin = 2;
    const wAvail = container.clientWidth - margin * 2;
    const hAvail = container.clientHeight - margin * 2;
    
    const virtualSize = 1000; // logical board canvas width & height
    const calculatedScale = Math.min(wAvail / virtualSize, hAvail / virtualSize);
    
    // Keep scale within sane bounds
    setScale(Math.max(0.1, calculatedScale));
  };

  useEffect(() => {
    resizeBoard();
    
    window.addEventListener('resize', resizeBoard);
    return () => {
      window.removeEventListener('resize', resizeBoard);
    };
  }, []);

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
        backgroundColor: '#130f1d'
      }}
    >
      <div 
        style={{
          width: '1000px',
          height: '1000px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          willChange: 'transform',
          position: 'absolute',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
