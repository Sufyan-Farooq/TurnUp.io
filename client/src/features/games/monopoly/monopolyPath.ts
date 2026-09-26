export interface MonopolyPathResult {
  steps: number[];
  isDirectTeleport: boolean;
  finalSpace: number;
}

/**
 * Calculates the clockwise perimeter step path for Monopoly.
 * Normal dice moves (1-12 spaces) step tile-by-tile around the 48 spaces.
 * Jail moves or card warps glide directly.
 */
export function getMonopolyStepPath(
  fromPos: number,
  toPos: number,
  inJail: boolean
): MonopolyPathResult {
  if (fromPos === toPos) {
    return { steps: [], isDirectTeleport: false, finalSpace: toPos };
  }

  // Sent to jail or in jail
  if (toPos === 12 && inJail) {
    return { steps: [12], isDirectTeleport: true, finalSpace: 12 };
  }

  const stepsCount = (toPos - fromPos + 48) % 48;
  // Normal dice rolls are between 1 and 12
  if (stepsCount >= 1 && stepsCount <= 12) {
    const steps: number[] = [];
    for (let i = 1; i <= stepsCount; i++) {
      steps.push((fromPos + i) % 48);
    }
    return {
      steps,
      isDirectTeleport: false,
      finalSpace: toPos
    };
  }

  // Large warps (chance cards, etc.)
  return {
    steps: [toPos],
    isDirectTeleport: true,
    finalSpace: toPos
  };
}
