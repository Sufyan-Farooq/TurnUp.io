import React from 'react';
import { getLudoColorName, getPlayerColorPalette } from '../../../theme/playerColors';
import { getSixLudoCoords, sixBaseCenter, sixPolar, SIX_BASE_SLOT_OFFSETS, SIX_SEAT_ANGLES } from './sixPlayerGeometry';

interface SixPlayerBoardSurfaceProps {
  activeSeat: number;
  names: (string | undefined)[];
}

const seatColors = getPlayerColorPalette(6);
const hexPoints = SIX_SEAT_ANGLES
  .map(angle => sixPolar(angle, 485))
  .map(({ x, y }) => `${x},${y}`).join(' ');
const innerHexPoints = SIX_SEAT_ANGLES
  .map(angle => sixPolar(angle, 473))
  .map(({ x, y }) => `${x},${y}`).join(' ');
const armPoint = (angle: number, radius: number, tangent: number) => {
  const center = sixPolar(angle, radius);
  const radians = angle * Math.PI / 180;
  return `${center.x - Math.sin(radians) * tangent},${center.y + Math.cos(radians) * tangent}`;
};

export const SixPlayerBoardSurface: React.FC<SixPlayerBoardSurfaceProps> = ({ activeSeat, names }) => (
  <>
    <svg className="ludo-six-art" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs>
        <radialGradient id="ludo-six-surface" cx="50%" cy="43%" r="68%">
          <stop stopColor="#183247" />
          <stop offset="1" stopColor="#0b1d2c" />
        </radialGradient>
        <linearGradient id="ludo-six-rim" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b18b5d" />
          <stop offset=".45" stopColor="#4d3328" />
          <stop offset="1" stopColor="#d0ab75" />
        </linearGradient>
      </defs>
      <polygon points={hexPoints} fill="url(#ludo-six-surface)" stroke="url(#ludo-six-rim)" strokeWidth="14" strokeLinejoin="round" />
      <polygon points={innerHexPoints} fill="none" stroke="#f4dab0" strokeOpacity=".35" strokeWidth="2" />
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const next = SIX_SEAT_ANGLES[(seat + 1) % 6] + (seat === 5 ? 360 : 0);
        const middle = sixPolar(angle + 30, 414);
        const innerA = sixPolar(angle, 105);
        const innerB = sixPolar(next, 105);
        const outerA = sixPolar(angle, 443);
        const outerB = sixPolar(next, 443);
        return <polygon key={`sector-${seat}`}
          points={`${innerA.x},${innerA.y} ${outerA.x},${outerA.y} ${middle.x},${middle.y} ${outerB.x},${outerB.y} ${innerB.x},${innerB.y}`}
          fill={seatColors[seat]} fillOpacity=".34" stroke={seatColors[seat]} strokeOpacity=".7" strokeWidth="3" />;
      })}
      {SIX_SEAT_ANGLES.map((angle, seat) =>
        <polygon key={`arm-${seat}`}
          points={[
            armPoint(angle, 103, -79), armPoint(angle, 452, -79),
            armPoint(angle, 452, 79), armPoint(angle, 103, 79)
          ].join(' ')}
          fill="#102839" stroke="#c0a783" strokeOpacity=".5" strokeWidth="2" />)}
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const laneAngle = angle + 60;
        const a = sixPolar(laneAngle - 30, 105);
        const b = sixPolar(laneAngle + 30, 105);
        return <path key={seat} d={`M 500 500 L ${a.x} ${a.y} A 105 105 0 0 1 ${b.x} ${b.y} Z`} fill={seatColors[seat]} fillOpacity=".9" stroke="#16232b" strokeWidth="2" />;
      })}
      <circle cx="500" cy="500" r="43" fill="#102637" stroke="#efdab8" strokeWidth="2" />
    </svg>
    {Array.from({ length: 78 }, (_, index) => {
      const coords = getSixLudoCoords(0, index, 0);
      const seat = Math.floor(index / 13);
      const isStart = index % 13 === 0;
      return <div key={`track-${index}`} className={`ludo-six-track-cell${isStart ? ' is-start' : ''}`}
        style={{ left: coords.x, top: coords.y, '--seat-color': isStart ? seatColors[seat] : undefined } as React.CSSProperties} />;
    })}
    {SIX_SEAT_ANGLES.map((_, seat) => Array.from({ length: 5 }, (_, step) => {
      const coords = getSixLudoCoords(seat, 78 + step, 0);
      return <div key={`lane-${seat}-${step}`} className="ludo-six-lane-cell"
        style={{ left: coords.x, top: coords.y, '--seat-color': seatColors[seat] } as React.CSSProperties} />;
    }))}
    {SIX_SEAT_ANGLES.map((_, seat) => {
      const center = sixBaseCenter(seat);
      return <div key={`base-${seat}`} className={`ludo-six-base${seat === activeSeat ? ' is-active' : ''}`}
        style={{ left: center.x, top: center.y, '--seat-color': seatColors[seat] } as React.CSSProperties}>
        <span className="ludo-six-base__name">{names[seat] || getLudoColorName(seat, 6)}</span>
        {SIX_BASE_SLOT_OFFSETS.map((slot, index) =>
          <span key={index} className="ludo-six-base__slot" style={{ left: 79 + slot.x, top: 79 + slot.y }} />)}
      </div>;
    })}
    <div className="ludo-six-home" aria-hidden="true">HOME</div>
  </>
);
