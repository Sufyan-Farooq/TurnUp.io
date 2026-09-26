// All six-player art and pawns use the same 1000px coordinate system.
// Seat 0 starts at angle -90° (top) on track cell 0 (0 * 13).
// Each 13-cell sector crosses one three-cell-wide arm: its outer start,
// 5 cells towards the center, 1 valley cell at the inner turn, and 6 cells
// outward along the next arm. Home lanes occupy the center column of each arm.
export const SIX_SEAT_ANGLES = [-90, -30, 30, 90, 150, 210] as const;

export const SIX_BASE_SLOT_OFFSETS = [
  { x: -29, y: -29 }, { x: 29, y: -29 },
  { x: -29, y: 29 }, { x: 29, y: 29 },
] as const;

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
  const midAngle = arm + 30;

  if (step === 0) {
    // Start cell on outer tip of arm
    return sixPolarTangent(arm, 415, 22);
  } else if (step <= 5) {
    // Inward lane: r from 375 down to 155
    const r = 375 - (step - 1) * 55;
    return sixPolarTangent(arm, r, 44);
  } else if (step === 6) {
    // Valley cell at inner corner
    return sixPolar(midAngle, 115);
  } else if (step <= 11) {
    // Outward lane on nextArm: r from 155 up to 375
    const r = 155 + (step - 7) * 55;
    return sixPolarTangent(nextArm, r, -44);
  } else {
    // Outer corner transition cell to next arm start
    return sixPolarTangent(nextArm, 415, -22);
  }
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
    return sixPolar(arm, 375 - step * 55);
  }
  return sixPolar(arm, 75);
}
