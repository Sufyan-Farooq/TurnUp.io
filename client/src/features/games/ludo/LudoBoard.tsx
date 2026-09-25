import React from 'react';
import { BoardWrapper } from '../../../components/BoardWrapper';
import type { GameRoom, BaseGameState } from '../types';
import { getPlayerColorPalette, getLudoColorName } from '../../../theme/playerColors';
import { getSixLudoCoords } from './sixPlayerGeometry';
import { SixPlayerBoardSurface } from './SixPlayerBoardSurface';
import './ludo.css';

export interface LudoGameSpecificState {
  /** playerId -> array of 4 token positions.
   *  -1 = base, 0..(trackLength-1) = common track,
   *  trackLength..trackLength+4 = home stretch, trackLength+5 = home.
   *  trackLength is 52 for 4-player games, 78 for 6-player games. */
  tokens: Record<string, number[]>;
  lastRoll: number;
  consecutiveSixes: number;
  rankings?: string[];
  maxPlayers?: number;
}

export type LudoGameState = BaseGameState<LudoGameSpecificState>;

export interface LudoBoardProps {
  gameState: LudoGameState;
  room: GameRoom | null;
  currentUserId: string;
  onMoveToken: (tokenIndex: number) => void;
}

// 4-player track: 52 cells, starting near each corner's launch cell.
const LUDO_TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

/**
 * Resolves a player's "base index" (0..3 for 4p, 0..5 for 6p) from their
 * chosen color, falling back to player list order for older rooms.
 */
export const getPlayerBaseIndex = (room: GameRoom | null, gameState: LudoGameState, pId: string): number => {
  const p = room?.players?.find(x => x.id === pId) || gameState.players?.find(x => x.id === pId);
  const color = p?.color;
  const maxPlayers = gameState.gameSpecificState.maxPlayers ?? room?.lobbySettings?.maxPlayers ?? 4;
  const colors = getPlayerColorPalette(maxPlayers);

  if (color) {
    const idx = colors.findIndex(candidate => candidate.toLowerCase() === color.toLowerCase());
    if (idx !== -1) return idx;
  }
  const idx = (room?.players || gameState.players || []).findIndex(x => x.id === pId);
  return idx === -1 ? 0 : idx;
};

/** Resolve pawn coordinates against the rendered four- or six-player board. */
export const getLudoCoords = (room: GameRoom | null, playerIdx: number, position: number, tokenIdx: number, maxPlayers?: number) => {
  const is6 = maxPlayers !== undefined
    ? maxPlayers === 6
    : room?.lobbySettings?.maxPlayers === 6;
  if (is6) return getSixLudoCoords(playerIdx, position, tokenIdx);
  const trackLength = 52;
  const cellW = 1000 / 15;
  const cellH = 1000 / 15;

  if (position === -1) {
    let r = 0, c = 0;
    if (playerIdx === 0) {
      r = tokenIdx < 2 ? 2.13 : 3.87;
      c = tokenIdx % 2 === 0 ? 2.13 : 3.87;
    } else if (playerIdx === 1) {
      r = tokenIdx < 2 ? 2.13 : 3.87;
      c = tokenIdx % 2 === 0 ? 9 + 2.13 : 9 + 3.87;
    } else if (playerIdx === 2) {
      r = tokenIdx < 2 ? 9 + 2.13 : 9 + 3.87;
      c = tokenIdx % 2 === 0 ? 9 + 2.13 : 9 + 3.87;
    } else {
      r = tokenIdx < 2 ? 9 + 2.13 : 9 + 3.87;
      c = tokenIdx % 2 === 0 ? 2.13 : 3.87;
    }
    return { x: c * cellW, y: r * cellH };
  } else if (position >= 0 && position < trackLength) {
    const coord = LUDO_TRACK_COORDS[position];
    return { x: (coord[1] + 0.5) * cellW, y: (coord[0] + 0.5) * cellH };
  } else if (position >= trackLength && position < (trackLength + 5)) {
    const step = position - trackLength;
    let r = 7, c = 7;
    if (playerIdx === 0) { r = 7; c = step + 1; }
    else if (playerIdx === 1) { r = step + 1; c = 7; }
    else if (playerIdx === 2) { r = 7; c = 13 - step; }
    else { r = 13 - step; c = 7; }
    return { x: (c + 0.5) * cellW, y: (r + 0.5) * cellH };
  } else {
    let r = 7, c = 7;
    if (playerIdx === 0) { r = 7; c = 6; }
    else if (playerIdx === 1) { r = 6; c = 7; }
    else if (playerIdx === 2) { r = 7; c = 8; }
    else { r = 8; c = 7; }
    return { x: (c + 0.5) * cellW, y: (r + 0.5) * cellH };
  }
};

/**
 * Whether a token at `pos` can legally move with `roll`, mirroring the
 * server's `LudoRuleset.isValidMove` (server/src/engine/ludo.ts) closely
 * enough for client-side "is this clickable" hinting — the server remains
 * authoritative and re-validates on MOVE_TOKEN.
 *
 * NOTE: the original inline `isTokenMoveValid` in App.tsx hardcoded a
 * 52-length track (`pos <= 51`, home `=== 57`) regardless of the 6-player
 * (78-length track) mode, which would misclassify home-stretch/home tokens
 * as on-track in 6-player games. Fixed here to take `trackLength` from the
 * room's `maxPlayers` setting, matching the server logic.
 */
export const isTokenMoveValid = (
  trackLength: number,
  playerIdx: number,
  pos: number,
  roll: number
): boolean => {
  const maxPos = trackLength + 5;
  if (pos === maxPos) return false; // Already home
  if (pos === -1) return roll === 6; // Requires a 6 to release from base
  if (pos >= 0 && pos <= (trackLength - 1)) {
    const startCell = playerIdx * 13;
    const stepsTaken = (pos - startCell + trackLength) % trackLength;
    return (stepsTaken + roll) <= maxPos;
  }
  if (pos >= trackLength && pos <= (trackLength + 4)) {
    return (pos + roll) <= maxPos;
  }
  return false;
};

/**
 * Ludo board: base quadrants, cross-shaped track, home stretches/center, and
 * player tokens (click-to-move when it's your turn and a token move is
 * pending). The board keeps socket/gameplay concerns outside this component;
 * moves are sent through `onMoveToken` and validated by the server.
 *
 * NOTE: there is no safe-zone capture protection in the server ruleset
 * (server/src/engine/ludo.ts) — the `.path-safe` star markers are purely
 * decorative here, matching the original; landing on them does not block
 * captures.
 */
export const LudoBoard: React.FC<LudoBoardProps> = ({ gameState, room, currentUserId, onMoveToken }) => {
  // Match state is authoritative once play begins; lobby settings can lag after
  // reconnecting and previously rendered a 6-player match on the 4-player grid.
  const maxPlayers = gameState.gameSpecificState.maxPlayers ?? room?.lobbySettings?.maxPlayers ?? 4;
  const is6 = maxPlayers === 6;
  const trackLength = is6 ? 78 : 52;
  const isMyTurn = gameState.activePlayerId === currentUserId;
  const activePlayerBaseIndex = getPlayerBaseIndex(room, gameState, gameState.activePlayerId);

  const ludoCells: React.ReactNode[] = [];

  if (!is6) {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (r < 6 && c < 6) continue; // Base Red
        if (r < 6 && c > 8) continue; // Base Green
        if (r > 8 && c > 8) continue; // Base Yellow
        if (r > 8 && c < 6) continue; // Base Blue
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue; // Center Home

        let cellClass = 'ludo-cell path-neutral';
        if (r === 7 && c >= 1 && c <= 5) cellClass = 'ludo-cell path-red';
        else if (r === 7 && c >= 9 && c <= 13) cellClass = 'ludo-cell path-yellow';
        else if (c === 7 && r >= 1 && r <= 5) cellClass = 'ludo-cell path-green';
        else if (c === 7 && r >= 9 && r <= 13) cellClass = 'ludo-cell path-blue';
        else if (r === 6 && c === 1) cellClass = 'ludo-cell path-red start-cell';
        else if (r === 1 && c === 8) cellClass = 'ludo-cell path-green start-cell';
        else if (r === 8 && c === 13) cellClass = 'ludo-cell path-yellow start-cell';
        else if (r === 13 && c === 6) cellClass = 'ludo-cell path-blue start-cell';
        else if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
          cellClass = 'ludo-cell path-safe';
        }

        ludoCells.push(
          <div
            key={`cell-${r}-${c}`}
            className={cellClass}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
          />
        );
      }
    }
  }

  // --- Ludo Coordinate Precomputations (for stacking multiple tokens sharing a cell) ---
  const ludoSharedCoords: Record<string, { pId: string; tIdx: number }[]> = {};
  Object.entries(gameState.gameSpecificState.tokens || {}).forEach(([pId, tokenPositions]) => {
    const playerIdx = getPlayerBaseIndex(room, gameState, pId);
    tokenPositions.forEach((pos, tIdx) => {
      const coords = getLudoCoords(room, playerIdx, pos, tIdx, maxPlayers);
      const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
      if (!ludoSharedCoords[key]) {
        ludoSharedCoords[key] = [];
      }
      ludoSharedCoords[key].push({ pId, tIdx });
    });
  });

  return (
    <BoardWrapper virtualWidth={1000} virtualHeight={1000}>
      <div className={`ludo-board-grid${is6 ? ' ludo-six-board' : ''}`}>
        {is6 ? (
          <SixPlayerBoardSurface
            activeSeat={activePlayerBaseIndex}
            names={getPlayerColorPalette(6).map((_, seat) => {
              const player = (room?.players || gameState.players || []).find(p => getPlayerBaseIndex(room, gameState, p.id) === seat);
              return player?.name;
            })}
          />
        ) : <>
        {/* Bases */}
        <div className={`ludo-cell base-red ${activePlayerBaseIndex === 0 ? 'is-active-base' : ''}`} style={{ gridRow: '1/7', gridColumn: '1/7' }}>
          <div className="base-inner">
            <div className="base-pocket" />
            <div className="base-pocket" />
            <div className="base-pocket" />
            <div className="base-pocket" />
          </div>
        </div>
          <>
            <div className={`ludo-cell base-green ${activePlayerBaseIndex === 1 ? 'is-active-base' : ''}`} style={{ gridRow: '1/7', gridColumn: '10/16' }}>
              <div className="base-inner">
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
              </div>
            </div>
            <div className={`ludo-cell base-yellow ${activePlayerBaseIndex === 2 ? 'is-active-base' : ''}`} style={{ gridRow: '10/16', gridColumn: '10/16' }}>
              <div className="base-inner">
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
              </div>
            </div>
            <div className={`ludo-cell base-blue ${activePlayerBaseIndex === 3 ? 'is-active-base' : ''}`} style={{ gridRow: '10/16', gridColumn: '1/7' }}>
              <div className="base-inner">
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
                <div className="base-pocket" />
              </div>
            </div>
          </>

        {/* Center Homes */}
          <div className="ludo-cell ludo-center" style={{ gridRow: '7/10', gridColumn: '7/10', display: 'flex', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              background: 'conic-gradient(from 315deg, var(--accent-green) 90deg, var(--accent-gold) 90deg 180deg, var(--accent-blue) 180deg 270deg, var(--accent-pink) 270deg)'
            }} />
            <div style={{
              position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%',
              backgroundColor: '#0d061f', borderRadius: '50%', border: '2px solid var(--accent-purple)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#fff', gap: '2px'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HOME</span>
              {gameState.gameSpecificState.lastRoll > 0 && (
                <span style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>{gameState.gameSpecificState.lastRoll}</span>
              )}
            </div>
          </div>

        {/* Render track cells */}
        {ludoCells}
        </>}

        {/* Render Tokens */}
        {Object.entries(gameState.gameSpecificState.tokens || {}).map(([pId, tokenPositions]) => {
          const playerIdx = getPlayerBaseIndex(room, gameState, pId);
          const playerObj = room?.players?.find((p) => p.id === pId) || gameState.players?.find((p) => p.id === pId);
          if (!playerObj) return null;

          return tokenPositions.map((pos, tIdx) => {
            const coords = getLudoCoords(room, playerIdx, pos, tIdx, maxPlayers);
            const key = `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
            const shared = ludoSharedCoords[key] || [];
            const count = shared.length;
            const indexInCell = shared.findIndex(t => t.pId === pId && t.tIdx === tIdx);

            let ox = 0, oy = 0;
            if (count > 1) {
              const angle = (indexInCell / count) * 2 * Math.PI;
              const radius = 12;
              ox = Math.cos(angle) * radius;
              oy = Math.sin(angle) * radius;
            }

            const isInteractive = isMyTurn
              && (gameState.subState === 'WAITING_FOR_TOKEN_MOVE')
              && (pId === currentUserId)
              && isTokenMoveValid(trackLength, playerIdx, pos, gameState.gameSpecificState.lastRoll);
            const colorName = getLudoColorName(playerIdx, is6 ? 6 : 4);

            return (
              <div
                key={`${pId}-${tIdx}`}
                className={`ludo-token color-${colorName} ${isInteractive ? 'interactive' : ''} ${pId === gameState.activePlayerId ? 'is-active-player' : ''} ${pId === currentUserId ? 'is-mine' : ''} ${pos === trackLength + 5 ? 'is-home' : ''}`}
                role={isInteractive ? 'button' : 'img'}
                tabIndex={isInteractive ? 0 : -1}
                aria-label={`${playerObj.name}'s token ${tIdx + 1}${pos === -1 ? ' in base' : pos === trackLength + 5 ? ' at home' : ` on space ${pos + 1}`}${isInteractive ? ', move this token' : ''}`}
                style={{
                  left: `${coords.x + ox}px`,
                  top: `${coords.y + oy}px`,
                  zIndex: 100 + playerIdx * 4 + tIdx,
                  borderColor: isInteractive ? '#fff' : undefined,
                  boxShadow: isInteractive ? '0 0 15px #fff, 0 0 10px currentColor' : undefined,
                }}
                onClick={() => {
                  if (isInteractive) {
                    onMoveToken(tIdx);
                  }
                }}
                onKeyDown={(event) => {
                  if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onMoveToken(tIdx);
                  }
                }}
                title={`${playerObj?.name}'s token ${tIdx + 1}${isInteractive ? ' — select to move' : ''}`}
              >
                <svg viewBox="0 0 100 100" width="22" height="22" fill="currentColor" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.35))' }}>
                  <circle cx="50" cy="25" r="16" />
                  <path d="M50 42c-12 0-20 8-20 20v6h40v-6c0-12-8-20-20-20z" />
                  <rect x="25" y="72" width="50" height="8" rx="4" />
                </svg>
                {isInteractive && <span className="ludo-token__move-indicator" aria-hidden="true">Move</span>}
              </div>
            );
          });
        })}
      </div>
    </BoardWrapper>
  );
};

export default LudoBoard;
