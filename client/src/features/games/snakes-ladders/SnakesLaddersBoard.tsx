import React from 'react';
import { BoardWrapper } from '../../../components/BoardWrapper';
import type { GameRoom, BaseGameState } from '../types';
import { getSerpentineCoordinates, getSnakesTokenSlot } from './boardGeometry';
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

const TOKEN_COLORS = ['#ff5c66', '#4e8cff', '#3fbf7f', '#ffc247', '#a782ff', '#ff9b54', '#51c8d4', '#f777b5'];

/**
 * Snakes & Ladders board: 10x10 serpentine grid with SVG routes, board
 * landmarks, and player tokens. Gameplay state remains entirely prop-driven.
 */
export const SnakesLaddersBoard: React.FC<SnakesLaddersBoardProps> = ({ gameState, room }) => {
  const positions = gameState.gameSpecificState.positions || {};
  const snakes = gameState.gameSpecificState.snakes || {};
  const ladders = gameState.gameSpecificState.ladders || {};
  const playerOrder = new Map(room?.players?.map((player, index) => [player.id, index]) || []);
  const tokenPlayers = Object.entries(positions)
    .filter(([, pos]) => Number.isInteger(pos) && pos >= 1 && pos <= 100)
    .sort(([a], [b]) => (playerOrder.get(a) ?? Infinity) - (playerOrder.get(b) ?? Infinity));
  const playersByCell = new Map<number, string[]>();
  tokenPlayers.forEach(([pId, pos]) => {
    const cellPlayers = playersByCell.get(pos) || [];
    cellPlayers.push(pId);
    playersByCell.set(pos, cellPlayers);
  });
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
        <svg className="sl-board-routes" viewBox="0 0 1000 1000" aria-hidden="true">
          <defs>
            <linearGradient id="snake-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bb6755" />
              <stop offset="100%" stopColor="#7d2f32" />
            </linearGradient>
            <linearGradient id="snake-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#619c75" />
              <stop offset="100%" stopColor="#2c624e" />
            </linearGradient>
            <linearGradient id="snake-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cf9455" />
              <stop offset="100%" stopColor="#92522e" />
            </linearGradient>
            <linearGradient id="ladder-rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a86b2d" />
              <stop offset="50%" stopColor="#e8bd71" />
              <stop offset="100%" stopColor="#995c24" />
            </linearGradient>
            <linearGradient id="ladder-rung-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8bd71" />
              <stop offset="100%" stopColor="#a86b2d" />
            </linearGradient>
          </defs>

          {/* Render Ladders */}
          {Object.entries(ladders).map(([baseStr, top], idx) =>
            renderLadder(parseInt(baseStr, 10), top, idx)
          )}

          {/* Render Snakes */}
          {Object.entries(snakes).map(([headStr, tail], idx) =>
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
          const ladderTop = Object.values(ladders).includes(num);
          const ladderBase = Object.prototype.hasOwnProperty.call(ladders, num);
          const snakeTail = Object.values(snakes).includes(num);
          const snakeHead = Object.prototype.hasOwnProperty.call(snakes, num);
          const markerClass = [
            ladderBase && 'is-ladder-base',
            ladderTop && 'is-ladder-top',
            snakeHead && 'is-snake-head',
            snakeTail && 'is-snake-tail',
            num === 1 && 'is-start',
            num === 100 && 'is-finish'
          ].filter(Boolean).join(' ');
          return (
            <div
              key={num}
              className={`sl-cell cell-color-${cellColorIndex} ${markerClass}`}
              aria-label={`Square ${num}${ladderBase ? `, ladder to ${ladders[num]}` : ''}${snakeHead ? `, snake to ${snakes[num]}` : ''}${num === 1 ? ', start' : ''}${num === 100 ? ', finish' : ''}`}
            >
              <span className="sl-cell-num">{num}</span>
              {ladderBase && <span className="sl-cell-route is-ladder">To {ladders[num]}</span>}
              {snakeHead && <span className="sl-cell-route is-snake">To {snakes[num]}</span>}
              {num === 1 && <span className="sl-cell-landmark">Start</span>}
              {num === 100 && <span className="sl-cell-landmark">Finish</span>}
            </div>
          );
        })}

        {/* Render Players' Tokens */}
        {tokenPlayers.map(([pId, pos], idx) => {
          const { x, y } = getSerpentineCoordinates(pos);
          const sharingCell = playersByCell.get(pos) || [];
          const slot = getSnakesTokenSlot(sharingCell.indexOf(pId), sharingCell.length);

          const playerObj = room?.players?.find(p => p.id === pId);
          const customColor = playerObj?.color?.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/)?.[0] || TOKEN_COLORS[idx % TOKEN_COLORS.length];

          return (
            <div
              key={pId}
              className={`player-token ${pId === gameState.activePlayerId ? 'is-active-player' : ''}`}
              role="img"
              aria-label={`${playerObj?.name ?? `Player ${idx + 1}`} on square ${pos}${pId === gameState.activePlayerId ? ', active player' : ''}`}
              style={{
                left: `${x + slot.x}px`,
                top: `${y + slot.y}px`,
                width: `${slot.size}px`,
                height: `${slot.size}px`,
                zIndex: 10 + idx,
                backgroundColor: customColor
              }}
              title={`${playerObj?.name ?? `Player ${idx + 1}`} — square ${pos}`}
            >
              <span className="player-token__initial" aria-hidden="true">{playerObj?.name?.trim().charAt(0).toUpperCase() || idx + 1}</span>
              {pId === gameState.activePlayerId && <span className="player-token__turn-flag" aria-hidden="true">Turn</span>}
            </div>
          );
        })}
      </div>
    </BoardWrapper>
  );
};

export default SnakesLaddersBoard;
