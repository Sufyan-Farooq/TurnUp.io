/** Distinct pawn centers for a shared cell, in board-coordinate pixels. */
export function getTokenStackOffset(index: number, count: number): { x: number; y: number } {
  if (count <= 1) return { x: 0, y: 0 };
  if (count === 2) return [{ x: -14, y: 0 }, { x: 14, y: 0 }][index] ?? { x: 0, y: 0 };
  if (count === 3) return [
    { x: 0, y: -14 },
    { x: -14, y: 12 },
    { x: 14, y: 12 },
  ][index] ?? { x: 0, y: 0 };
  return [
    { x: -14, y: -14 },
    { x: 14, y: -14 },
    { x: -14, y: 14 },
    { x: 14, y: 14 },
  ][index] ?? { x: 0, y: 0 };
}

/** Mirrors the server's LudoRuleset MOVE_TOKEN destination calculation. */
export function getTokenDestination(trackLength: number, playerIndex: number, position: number, roll: number): number | null {
  const home = trackLength + 5;
  if (!Number.isInteger(roll) || roll < 1 || roll > 6 || position === home) return null;
  const startCell = playerIndex * 13;
  if (position === -1) return roll === 6 ? startCell : null;
  if (position >= 0 && position < trackLength) {
    const stepsTaken = (position - startCell + trackLength) % trackLength;
    const nextSteps = stepsTaken + roll;
    if (nextSteps > home) return null;
    return nextSteps < trackLength
      ? (startCell + nextSteps) % trackLength
      : nextSteps;
  }
  if (position >= trackLength && position < home && position + roll <= home) {
    return position + roll;
  }
  return null;
}
