export interface LudoPathResult {
  steps: number[];
  type: 'base_exit' | 'step_path' | 'retreat' | 'teleport';
  finalPos: number;
}

/**
 * Calculates the natural step-by-step path for Ludo.
 * Handles base release, common track traversal, lap-boundary home lane entry,
 * and retreat to base when captured.
 */
export function getLudoStepPath(
  trackLength: number,
  playerIdx: number,
  fromPos: number,
  toPos: number
): LudoPathResult {
  if (fromPos === toPos) {
    return { steps: [], type: 'step_path', finalPos: toPos };
  }

  const startCell = playerIdx * 13;
  const home = trackLength + 5;

  // Case 1: Exiting base into start cell
  if (fromPos === -1 && toPos === startCell) {
    return {
      steps: [startCell],
      type: 'base_exit',
      finalPos: startCell
    };
  }

  // Case 2: Captured and returned to base
  if (toPos === -1 && fromPos !== -1) {
    return {
      steps: [-1],
      type: 'retreat',
      finalPos: -1
    };
  }

  // Case 3: Step-by-step advance along track and home stretch
  if (fromPos >= 0) {
    const steps: number[] = [];
    let curr = fromPos;
    for (let s = 0; s < 6; s++) {
      if (curr === toPos) break;
      if (curr >= 0 && curr < trackLength) {
        const stepsTaken = (curr - startCell + trackLength) % trackLength;
        const nextSteps = stepsTaken + 1;
        curr = nextSteps < trackLength ? (startCell + nextSteps) % trackLength : nextSteps;
        steps.push(curr);
      } else if (curr >= trackLength && curr < home) {
        curr = curr + 1;
        steps.push(curr);
      } else {
        break;
      }
    }

    if (curr === toPos && steps.length > 0) {
      return {
        steps,
        type: 'step_path',
        finalPos: toPos
      };
    }
  }

  // Direct move for sudden synchronization or unhandled jumps
  return {
    steps: [toPos],
    type: 'teleport',
    finalPos: toPos
  };
}
