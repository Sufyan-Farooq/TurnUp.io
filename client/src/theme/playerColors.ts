// Single source of truth for player token/avatar colors.
// Mirrors the CSS token-0..3 classes and Ludo base-* colors in index.css,
// and the server's fixed per-color-index track offsets in engine/ludo.ts.
export const PLAYER_COLORS = [
  { id: 'red', hex: '#FF5C66', cssVar: 'var(--coral)' },
  { id: 'blue', hex: '#4E8CFF', cssVar: 'var(--accent-blue)' },
  { id: 'green', hex: '#3FBF7F', cssVar: 'var(--accent-green)' },
  { id: 'yellow', hex: '#FFC247', cssVar: 'var(--gold)' },
  { id: 'orange', hex: '#FB8500', cssVar: 'var(--accent-orange)' },
  { id: 'purple', hex: '#6C3CE9', cssVar: 'var(--violet)' },
] as const;

export type PlayerColorId = (typeof PLAYER_COLORS)[number]['id'];

export function getPlayerColorHex(colorId: string | undefined): string {
  return PLAYER_COLORS.find((c) => c.id === colorId)?.hex ?? PLAYER_COLORS[0].hex;
}

export function getPlayerColorByIndex(index: number) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
