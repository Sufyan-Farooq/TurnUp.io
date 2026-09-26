import React from 'react';
import { getLudoColorName, getPlayerColorPalette } from '../../../theme/playerColors';
import { getSixLudoCoords, sixBaseCenter, sixPolar, SIX_BASE_SLOT_OFFSETS, SIX_SEAT_ANGLES } from './sixPlayerGeometry';

interface SixPlayerBoardSurfaceProps {
  activeSeat: number;
  names: (string | undefined)[];
}

const seatColors = getPlayerColorPalette(6);

// Outer hexagon vertices with flat top and bottom (angles -120, -60, 0, 60, 120, 180)
const outerHexAngles = [-120, -60, 0, 60, 120, 180];
const hexPoints = outerHexAngles
  .map(angle => sixPolar(angle, 490))
  .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const innerHexPoints = outerHexAngles
  .map(angle => sixPolar(angle, 476))
  .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export const SixPlayerBoardSurface: React.FC<SixPlayerBoardSurfaceProps> = ({ activeSeat, names }) => (
  <>
    <svg className="ludo-six-art" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs>
        <radialGradient id="ludo-six-surface" cx="50%" cy="46%" r="68%">
          <stop stopColor="#1a364c" />
          <stop offset="0.65" stopColor="#102638" />
          <stop offset="1" stopColor="#081824" />
        </radialGradient>
        <linearGradient id="ludo-six-rim" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#cfa872" />
          <stop offset=".45" stopColor="#5c3f2e" />
          <stop offset="1" stopColor="#e3be85" />
        </linearGradient>
        <filter id="ludo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Hexagonal Tabletop Surface */}
      <polygon points={hexPoints} fill="url(#ludo-six-surface)" stroke="url(#ludo-six-rim)" strokeWidth="12" strokeLinejoin="round" />
      <polygon points={innerHexPoints} fill="none" stroke="#f4dab0" strokeOpacity=".3" strokeWidth="2" />

      {/* 6 Radial Sector Backgrounds */}
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const a1 = sixPolar(angle - 30, 475);
        const a2 = sixPolar(angle + 30, 475);
        return (
          <path
            key={`sector-bg-${seat}`}
            d={`M 500 500 L ${a1.x} ${a1.y} L ${a2.x} ${a2.y} Z`}
            fill={seatColors[seat]}
            fillOpacity="0.09"
          />
        );
      })}

      {/* 6 Center Goal Wedges */}
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const a1 = sixPolar(angle - 30, 85);
        const a2 = sixPolar(angle + 30, 85);
        return (
          <path
            key={`center-wedge-${seat}`}
            d={`M 500 500 L ${a1.x} ${a1.y} A 85 85 0 0 1 ${a2.x} ${a2.y} Z`}
            fill={seatColors[seat]}
            fillOpacity="0.88"
            stroke="#0b1a26"
            strokeWidth="2.5"
          />
        );
      })}
      <circle cx="500" cy="500" r="32" fill="#0d2130" stroke="#f4dab0" strokeWidth="3" />
    </svg>

    {/* 78 Track Cells */}
    {Array.from({ length: 78 }, (_, index) => {
      const coords = getSixLudoCoords(0, index, 0);
      const seat = Math.floor(index / 13);
      const isStart = index % 13 === 0;
      const isSafe = index % 13 === 8;
      return (
        <div
          key={`track-${index}`}
          className={`ludo-six-track-cell${isStart ? ' is-start' : ''}${isSafe ? ' is-safe' : ''}`}
          style={{
            left: coords.x,
            top: coords.y,
            '--seat-color': isStart ? seatColors[seat] : undefined,
          } as React.CSSProperties}
          title={isStart ? `${names[seat] || getLudoColorName(seat, 6)} Start (Space ${index + 1})` : isSafe ? `Safe Space ${index + 1}` : `Space ${index + 1}`}
        >
          {isStart && <span aria-hidden="true">★</span>}
          {isSafe && <span aria-hidden="true">★</span>}
        </div>
      );
    })}

    {/* 30 Home Lane Cells (5 per seat) */}
    {SIX_SEAT_ANGLES.map((_, seat) =>
      Array.from({ length: 5 }, (_, step) => {
        const coords = getSixLudoCoords(seat, 78 + step, 0);
        return (
          <div
            key={`lane-${seat}-${step}`}
            className="ludo-six-lane-cell"
            style={{
              left: coords.x,
              top: coords.y,
              '--seat-color': seatColors[seat],
            } as React.CSSProperties}
            title={`${names[seat] || getLudoColorName(seat, 6)} Home Lane ${step + 1}`}
          />
        );
      })
    )}

    {/* 6 Triangular / Circular Bases with 4 Sockets Each */}
    {SIX_SEAT_ANGLES.map((_, seat) => {
      const center = sixBaseCenter(seat);
      return (
        <div
          key={`base-${seat}`}
          className={`ludo-six-base${seat === activeSeat ? ' is-active' : ''}`}
          style={{
            left: center.x,
            top: center.y,
            '--seat-color': seatColors[seat],
          } as React.CSSProperties}
        >
          <span className="ludo-six-base__name">{names[seat] || getLudoColorName(seat, 6)}</span>
          {SIX_BASE_SLOT_OFFSETS.map((slot, index) => (
            <span
              key={index}
              className="ludo-six-base__slot"
              style={{ left: 83 + slot.x, top: 83 + slot.y }}
            />
          ))}
        </div>
      );
    })}

    <div className="ludo-six-home" aria-hidden="true">HOME</div>
  </>
);
