export interface SnakesPathResult {
  steps: number[];
  isSnakeOrLadder: boolean;
  finalSquare: number;
}

/**
 * Calculates the natural step-by-step path for Snakes & Ladders.
 * If a snake or ladder is encountered, returns the intermediate steps
 * leading up to the head/base, followed by the final destination.
 */
export function getSnakesStepPath(
  fromPos: number,
  toPos: number,
  lastRoll: number,
  snakes: Record<number, number>,
  ladders: Record<number, number>
): SnakesPathResult {
  if (fromPos === toPos) {
    return { steps: [], isSnakeOrLadder: false, finalSquare: toPos };
  }

  // Check if this move was triggered by landing on a snake or ladder
  const expectedLanding = fromPos + (lastRoll > 0 ? lastRoll : 0);
  const isSnake = snakes[expectedLanding] === toPos;
  const isLadder = ladders[expectedLanding] === toPos;

  if ((isSnake || isLadder) && expectedLanding <= 100 && expectedLanding > fromPos) {
    const steps: number[] = [];
    for (let p = fromPos + 1; p <= expectedLanding; p++) {
      steps.push(p);
    }
    return {
      steps,
      isSnakeOrLadder: true,
      finalSquare: toPos
    };
  }

  // Normal advance (step-by-step)
  if (toPos > fromPos && toPos - fromPos <= 6) {
    const steps: number[] = [];
    for (let p = fromPos + 1; p <= toPos; p++) {
      steps.push(p);
    }
    return {
      steps,
      isSnakeOrLadder: false,
      finalSquare: toPos
    };
  }

  // Direct move for board resets or unexpected jumps
  return {
    steps: [toPos],
    isSnakeOrLadder: false,
    finalSquare: toPos
  };
}
