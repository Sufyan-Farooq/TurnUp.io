// Seat order must match client/src/theme/playerColors.ts and the board geometry.
const FOUR_SEATS = ['#FF5C66', '#3FBF7F', '#FFC247', '#4E8CFF'] as const;
const SIX_SEATS = ['#FF5C66', '#4E8CFF', '#3FBF7F', '#FFC247', '#FB8500', '#6C3CE9'] as const;

export function getLudoSeatColors(maxPlayers: number): readonly string[] {
  return maxPlayers === 6 ? SIX_SEATS : FOUR_SEATS;
}
