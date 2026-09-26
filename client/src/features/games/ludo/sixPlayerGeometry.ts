// All six-player art and pawns use the same 1000px coordinate system. The
// engine's seat N starts on track cell N * 13. Each 13-cell sector crosses
// one three-cell-wide arm: its outer center start, six cells toward the
// middle, and six cells outward along the next arm. Home lanes occupy the
// empty center column of the clockwise arm. Keep these coordinates shared
// by the board cells and pawns; changing one without the other breaks play.
export const SIX_SEAT_ANGLES = [-150, -90, -30, 30, 90, 150] as const;
export const SIX_BASE_SLOT_OFFSETS = [
  { x: -29, y: -29 }, { x: 29, y: -29 },
  { x: -29, y: 29 }, { x: 29, y: 29 },
] as const;

export function sixPolar(angle: number, radius: number) {
  const radians = angle * Math.PI / 180;
  return { x: 500 + Math.cos(radians) * radius, y: 500 + Math.sin(radians) * radius };
}

export function sixBaseCenter(seat: number) {
  return sixPolar((SIX_SEAT_ANGLES[seat] ?? SIX_SEAT_ANGLES[0]) + 30, 330);
}

export function sixTrackCenter(position: number) {
  const normalized = ((position % 78) + 78) % 78;
  const arm = Math.floor(normalized / 13);
  const step = normalized % 13;
  const angle = SIX_SEAT_ANGLES[arm] ?? SIX_SEAT_ANGLES[0];
  if (step === 0) return sixPolar(angle, 415);

  const trackAngle = step <= 6 ? angle : angle + 60;
  const radius = step <= 6 ? 415 - (step - 1) * 55 : 140 + (step - 7) * 55;
  const tangent = step <= 6 ? 44 : -44;
  const radians = trackAngle * Math.PI / 180;
  const center = sixPolar(trackAngle, radius);
  return {
    x: center.x - Math.sin(radians) * tangent,
    y: center.y + Math.cos(radians) * tangent,
  };
}

export function getSixLudoCoords(seat: number, position: number, token: number) {
  const angle = SIX_SEAT_ANGLES[seat] ?? SIX_SEAT_ANGLES[0];
  if (position === -1) {
    const base = sixBaseCenter(seat);
    const slot = SIX_BASE_SLOT_OFFSETS[token] ?? SIX_BASE_SLOT_OFFSETS[0];
    return { x: base.x + slot.x, y: base.y + slot.y };
  }
  if (position >= 0 && position < 78) {
    return sixTrackCenter(position);
  }
  if (position >= 78 && position < 83) {
    return sixPolar(angle + 60, 360 - (position - 78) * 55);
  }
  return sixPolar(angle + 60, 76);
}
