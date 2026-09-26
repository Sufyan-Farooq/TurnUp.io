// All six-player art and pawns use the same 1000px coordinate system.
// Seat 0 starts at angle -90° (top) on track cell 0 (0 * 13).
// Each 13-cell sector follows six cells inward on one arm, six outward on
// the next, then the outer center tile that joins the following start cell.
// Every arm is a regular three-column grid: two track columns and a home lane.
export const SIX_SEAT_ANGLES = [-90, -30, 30, 90, 150, 210] as const;

const ARM_OUTER_RADIUS = 420;
const ARM_INNER_RADIUS = 145;
const CELL_SPACING = 55;

export const SIX_BASE_SLOT_OFFSETS = [
  { x: -29, y: -29 }, { x: 29, y: -29 },
  { x: -29, y: 29 }, { x: 29, y: 29 },
] as const;

export const SIX_PLAYER_SAFE_OFFSET = 8;

export function isSixPlayerStarSpace(position: number) {
  return position >= 0 && position < 78 && position % 13 === SIX_PLAYER_SAFE_OFFSET;
}

export function sixPolar(angle: number, radius: number) {
  const radians = angle * Math.PI / 180;
  return { x: 500 + Math.cos(radians) * radius, y: 500 + Math.sin(radians) * radius };
}

export function sixPolarTangent(angle: number, radius: number, tangent: number) {
  const radians = angle * Math.PI / 180;
  const c = sixPolar(angle, radius);
  return {
    x: c.x - Math.sin(radians) * tangent,
    y: c.y + Math.cos(radians) * tangent,
  };
}

export function sixBaseCenter(seat: number) {
  const arm = SIX_SEAT_ANGLES[seat] ?? SIX_SEAT_ANGLES[0];
  return sixPolar(arm + 30, 340);
}

export function sixTrackCenter(position: number) {
  const normalized = ((position % 78) + 78) % 78;
  const sector = Math.floor(normalized / 13);
  const step = normalized % 13;
  const arm = SIX_SEAT_ANGLES[sector] ?? SIX_SEAT_ANGLES[0];
  const nextArm = SIX_SEAT_ANGLES[(sector + 1) % 6] ?? SIX_SEAT_ANGLES[0];
  if (step < 6) {
    return sixPolarTangent(arm, ARM_OUTER_RADIUS - step * CELL_SPACING, CELL_SPACING);
  }
  if (step < 12) {
    return sixPolarTangent(nextArm, ARM_INNER_RADIUS + (step - 6) * CELL_SPACING, -CELL_SPACING);
  }
  return sixPolar(nextArm, ARM_OUTER_RADIUS);
}

/** Keep each square aligned to its arm instead of twisting it toward a turn. */
export function sixTrackTileAngle(position: number) {
  const normalized = ((position % 78) + 78) % 78;
  const sector = Math.floor(normalized / 13);
  const step = normalized % 13;
  const arm = SIX_SEAT_ANGLES[sector];
  return `${step < 6 ? arm : SIX_SEAT_ANGLES[(sector + 1) % 6]}deg`;
}

export function sixLaneTileAngle(seat: number) {
  const arm = SIX_SEAT_ANGLES[seat] ?? SIX_SEAT_ANGLES[0];
  return `${arm + 180}deg`;
}

export function getSixLudoCoords(seat: number, position: number, token: number) {
  const arm = SIX_SEAT_ANGLES[seat] ?? SIX_SEAT_ANGLES[0];
  if (position === -1) {
    const base = sixBaseCenter(seat);
    const slot = SIX_BASE_SLOT_OFFSETS[token] ?? SIX_BASE_SLOT_OFFSETS[0];
    return { x: base.x + slot.x, y: base.y + slot.y };
  }
  if (position >= 0 && position < 78) {
    return sixTrackCenter(position);
  }
  if (position >= 78 && position < 83) {
    const step = position - 78;
    return sixPolar(arm, ARM_OUTER_RADIUS - (step + 1) * CELL_SPACING);
  }
  return sixPolar(arm, 75);
}
