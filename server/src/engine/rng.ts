export class DeterministicRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Generates a 32-bit random unsigned integer.
   */
  public nextInt(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Returns a float value between [0, 1).
   */
  public nextFloat(): number {
    return this.nextInt() / 4294967296;
  }

  /**
   * Simulates a dice roll (min to max).
   */
  public rollRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Shuffles an array in place deterministically.
   */
  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  public getState(): number {
    return this.state;
  }

  public setState(state: number): void {
    this.state = state;
  }
}

/**
 * Safely reconstructs a DeterministicRNG from a persisted rngState string.
 * Guards against a corrupted/non-numeric rngState producing a broken (NaN-seeded) RNG,
 * which would otherwise silently make every subsequent roll/shuffle undefined behavior.
 */
export function createRngFromState(rngState: string): DeterministicRNG {
  const seed = parseInt(rngState, 10);
  if (!Number.isFinite(seed)) {
    throw new Error(`Internal engine error: corrupted rngState "${rngState}" could not be parsed into a numeric seed.`);
  }
  return new DeterministicRNG(seed);
}
