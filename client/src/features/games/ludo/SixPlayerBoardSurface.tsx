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
          <stop stopColor="#302844" />
          <stop offset="1" stopColor="#171322" />
        </radialGradient>
      </defs>
      <polygon points={hexPoints} fill="url(#ludo-six-surface)" stroke="#a892c7" strokeWidth="7" />
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const next = SIX_SEAT_ANGLES[(seat + 1) % 6] + (seat === 5 ? 360 : 0);
        const middle = sixPolar(angle + 30, 414);
        const innerA = sixPolar(angle, 105);
        const innerB = sixPolar(next, 105);
        const outerA = sixPolar(angle, 443);
        const outerB = sixPolar(next, 443);
        return <polygon key={`sector-${seat}`}
          points={`${innerA.x},${innerA.y} ${outerA.x},${outerA.y} ${middle.x},${middle.y} ${outerB.x},${outerB.y} ${innerB.x},${innerB.y}`}
          fill={seatColors[seat]} fillOpacity=".27" stroke={seatColors[seat]} strokeOpacity=".62" strokeWidth="3" />;
      })}
      {SIX_SEAT_ANGLES.map((angle, seat) =>
        <polygon key={`arm-${seat}`}
          points={[
            armPoint(angle, 103, -79), armPoint(angle, 452, -79),
            armPoint(angle, 452, 79), armPoint(angle, 103, 79)
          ].join(' ')}
          fill="#211a30" stroke="#b9a9ce" strokeOpacity=".45" strokeWidth="2" />)}
      {SIX_SEAT_ANGLES.map((angle, seat) => {
        const a = sixPolar(angle - 30, 105);
        const b = sixPolar(angle + 30, 105);
        return <path key={seat} d={`M 500 500 L ${a.x} ${a.y} A 105 105 0 0 1 ${b.x} ${b.y} Z`} fill={seatColors[seat]} fillOpacity=".9" />;
      })}
      <circle cx="500" cy="500" r="43" fill="#171322" stroke="#ebdfff" strokeWidth="2" />
    </svg>
    {Array.from({ length: 78 }, (_, index) => {
      const coords = getSixLudoCoords(0, index, 0);
      const seat = Math.floor(index / 13);
      const isStart = index % 13 === 0;
      return <div key={`track-${index}`} className={`ludo-six-track-cell${isStart ? ' is-start' : ''}${index % 13 === 8 ? ' is-safe' : ''}`}
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
