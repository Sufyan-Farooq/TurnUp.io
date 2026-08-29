import React from 'react';
import { BoardWrapper } from '../../../components/BoardWrapper';
import type { GameRoom, BaseGameState } from '../types';
import './snakes-ladders.css';

export interface SnakesLaddersGameSpecificState {
  /** playerId -> cell (1-100) */
  positions: Record<string, number>;
  /** head -> tail */
  snakes: Record<number, number>;
  /** base -> top */
  ladders: Record<number, number>;
  lastRoll: number;
}

export type SnakesLaddersGameState = BaseGameState<SnakesLaddersGameSpecificState>;

export interface SnakesLaddersBoardProps {
  gameState: SnakesLaddersGameState;
  room: GameRoom | null;
}

/**
 * Serpentine coordinates lookup (reversing standard layout), extracted
 * verbatim from App.tsx's `getSerpentineCoordinates`.
 */
export const getSerpentineCoordinates = (cellNum: number) => {
  const index = cellNum - 1;
  const row = Math.floor(index / 10);
  const colRemainder = index % 10;
  const col = (row % 2 === 1) ? (9 - colRemainder) : colRemainder;

  // Grid alignment: x-offset left, y-offset top
  const cellSize = 100; // grid logic size
  const x = col * cellSize + 50;
  const y = (9 - row) * cellSize + 50;

  return { x, y };
};

/**
 * Snakes & Ladders board: 10x10 serpentine grid with animated SVG snake/ladder
 * overlays and player tokens. Extracted from App.tsx's `renderSnakesLaddersBoard`
 * with no behavior changes — only componentization, prop-driven data, and
 * wrapping in `BoardWrapper` internally (the caller no longer needs to wrap it).
 */
export const SnakesLaddersBoard: React.FC<SnakesLaddersBoardProps> = ({ gameState, room }) => {
  // Helper to render realistic, detailed snake body
  const renderSnake = (head: number, tail: number, snakeIdx: number) => {
    const p1 = getSerpentineCoordinates(head);
    const p2 = getSerpentineCoordinates(tail);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    if (L === 0) return null;

    const ux = dx / L;
    const uy = dy / L;
    const nx = -uy;
    const ny = ux;

    const pointsCount = 35;
    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      const bx = p1.x + ux * t * L;
      const by = p1.y + uy * t * L;

      // Wiggle oscillation
      const wave = Math.sin(t * Math.PI * 3.5) * Math.sin(t * Math.PI) * 18;
      const cx = bx + nx * wave;
      const cy = by + ny * wave;

      // Tapered radius
      let r = 0;
      if (t < 0.12) {
        r = 5 + 9 * (t / 0.12);
      } else {
        r = 14 * (1 - t) + 2.5;
      }

      leftPoints.push({ x: cx + nx * r, y: cy + ny * r });
      rightPoints.push({ x: cx - nx * r, y: cy - ny * r });
    }

    let pathD = `M ${leftPoints[0].x} ${leftPoints[0].y}`;
    for (let i = 1; i <= pointsCount; i++) {
      pathD += ` L ${leftPoints[i].x} ${leftPoints[i].y}`;
    }
    for (let i = pointsCount; i >= 0; i--) {
      pathD += ` L ${rightPoints[i].x} ${rightPoints[i].y}`;
    }
    pathD += ' Z';

    // Head details
    const h1 = leftPoints[0];
    const h2 = rightPoints[0];
    const headCenterX = (h1.x + h2.x) / 2;
    const headCenterY = (h1.y + h2.y) / 2;

    // Forward tangent direction
    const tNext = 1.5 / pointsCount;
    const nextBx = p1.x + ux * tNext * L;
    const nextBy = p1.y + uy * tNext * L;
    const nextWave = Math.sin(tNext * Math.PI * 3.5) * Math.sin(tNext * Math.PI) * 18;
    const nextCx = nextBx + nx * nextWave;
    const nextCy = nextBy + ny * nextWave;

    const fwdX = headCenterX - nextCx;
    const fwdY = headCenterY - nextCy;
    const fwdL = Math.sqrt(fwdX * fwdX + fwdY * fwdY) || 1;
    const fx = fwdX / fwdL;
    const fy = fwdY / fwdL;
    const rx = -fy;
    const ry = fx;

    // Tongue split
    const tongueLen = 14;
    const tx = headCenterX + fx * tongueLen;
    const ty = headCenterY + fy * tongueLen;
    const txL = tx + (fx + rx) * 5;
    const tyL = ty + (fy + ry) * 5;
    const txR = tx + (fx - rx) * 5;
    const tyR = ty + (fy - ry) * 5;

    return (
      <g key={`s-${head}-${snakeIdx}`}>
        {/* Tongue */}
        <path
          d={`M ${headCenterX} ${headCenterY} L ${tx} ${ty} M ${tx} ${ty} L ${txL} ${tyL} M ${tx} ${ty} L ${txR} ${tyR}`}
          stroke="#d90429"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Body */}
        <path
          d={pathD}
          fill={`url(#snake-grad-${snakeIdx % 3})`}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' }}
        />
        {/* Eyes */}
        <circle cx={headCenterX + rx * 4 + fx * 1} cy={headCenterY + ry * 4 + fy * 1} r="2.5" fill="#fff" />
        <circle cx={headCenterX + rx * 4 + fx * 1} cy={headCenterY + ry * 4 + fy * 1} r="1" fill="#000" />
        <circle cx={headCenterX - rx * 4 + fx * 1} cy={headCenterY - ry * 4 + fy * 1} r="2.5" fill="#fff" />
        <circle cx={headCenterX - rx * 4 + fx * 1} cy={headCenterY - ry * 4 + fy * 1} r="1" fill="#000" />
      </g>
    );
  };

  // Helper to render metallic gold parallel-rail ladders
  const renderLadder = (base: number, top: number, ladderIdx: number) => {
    const p1 = getSerpentineCoordinates(base);
    const p2 = getSerpentineCoordinates(top);
    if (p1.x === p2.x) {
      p2.x += 0.1;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    if (L === 0) return null;

    const ux = dx / L;
    const uy = dy / L;
    const nx = -uy;
    const ny = ux;

    const halfW = 15;

    // Parallel Rails
    const lx1 = p1.x + nx * halfW;
    const ly1 = p1.y + ny * halfW;
    const lx2 = p2.x + nx * halfW;
    const ly2 = p2.y + ny * halfW;

    const rx1 = p1.x - nx * halfW;
    const ry1 = p1.y - ny * halfW;
    const rx2 = p2.x - nx * halfW;
    const ry2 = p2.y - ny * halfW;

    // Rungs spacing
    const rungSpace = 25;
    const numRungs = Math.floor(L / rungSpace);
    const rungs: React.ReactNode[] = [];

    for (let i = 1; i <= numRungs; i++) {
      const t = i / (numRungs + 1);
      const cx = p1.x + ux * t * L;
      const cy = p1.y + uy * t * L;
      rungs.push(
        <line
          key={`rung-${i}`}
          x1={cx + nx * halfW}
          y1={cy + ny * halfW}
          x2={cx - nx * halfW}
          y2={cy - ny * halfW}
          stroke="url(#ladder-rung-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    }

    return (
      <g key={`l-${base}-${ladderIdx}`} style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.5))' }}>
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="url(#ladder-rail-grad)" strokeWidth="6" strokeLinecap="round" />
        <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke="url(#ladder-rail-grad)" strokeWidth="6" strokeLinecap="round" />
        {rungs}
      </g>
    );
  };

  return (
    <BoardWrapper>
      <div className="sl-board-grid">
        {/* Visual Overlay SVG */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '1000px', height: '1000px', pointerEvents: 'none', zIndex: 5 }}>
          <defs>
            <linearGradient id="snake-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d90429" />
              <stop offset="100%" stopColor="#5c000b" />
            </linearGradient>
            <linearGradient id="snake-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38b000" />
              <stop offset="100%" stopColor="#004b23" />
            </linearGradient>
            <linearGradient id="snake-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7000" />
              <stop offset="100%" stopColor="#9a1f00" />
            </linearGradient>
            <linearGradient id="ladder-rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb703" />
              <stop offset="50%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#fb8500" />
            </linearGradient>
            <linearGradient id="ladder-rung-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffb703" />
              <stop offset="100%" stopColor="#fb8500" />
            </linearGradient>
          </defs>

          {/* Render Ladders */}
          {Object.entries(gameState.gameSpecificState.ladders || {}).map(([baseStr, top], idx) =>
            renderLadder(parseInt(baseStr, 10), top, idx)
          )}

          {/* Render Snakes */}
          {Object.entries(gameState.gameSpecificState.snakes || {}).map(([headStr, tail], idx) =>
            renderSnake(parseInt(headStr, 10), tail, idx)
          )}
        </svg>

        {/* Serpentine Grid Cells */}
        {Array.from({ length: 100 }, (_, idx) => {
          const r = Math.floor(idx / 10);
          const c = idx % 10;
          const serpentineRow = 9 - r;
          const num = (serpentineRow % 2 === 0)
            ? (serpentineRow * 10 + c + 1)
            : (serpentineRow * 10 + (9 - c) + 1);

          const cellColorIndex = (r + c) % 4;
          return (
            <div key={num} className={`sl-cell cell-color-${cellColorIndex}`}>
              <span className="sl-cell-num">{num}</span>
            </div>
          );
        })}

        {/* Render Players' Tokens */}
        {Object.entries(gameState.gameSpecificState.positions || {}).map(([pId, pos], idx) => {
          const { x, y } = getSerpentineCoordinates(pos);
          const offsetSize = 12;
          const xOffset = (idx % 2 === 0 ? -1 : 1) * offsetSize;
          const yOffset = (idx >= 2 ? 1 : -1) * offsetSize;

          const playerObj = room?.players?.find(p => p.id === pId);
          const customColor = playerObj?.color;

          return (
            <div
              key={pId}
              className={`player-token ${customColor ? '' : `token-${idx}`}`}
              style={{
                left: `${x - 12 + xOffset}px`,
                top: `${y - 12 + yOffset}px`,
                zIndex: 10 + idx,
                backgroundColor: customColor || undefined,
                boxShadow: customColor ? `0 0 10px ${customColor}` : undefined
              }}
              title={playerObj?.name}
            />
          );
        })}
      </div>
    </BoardWrapper>
  );
};

export default SnakesLaddersBoard;
