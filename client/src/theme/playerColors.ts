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

export function getPlayerColorHex(colorId: string | undefined, indexFallback = 0): string {
  return (
    PLAYER_COLORS.find((c) => c.id === colorId)?.hex ??
    getPlayerColorByIndex(indexFallback).hex
  );
}

export function getPlayerColorByIndex(index: number) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

/** Ordered hex palette for a lobby of the given size (Ludo boards use 4 or 6 seats). */
export function getPlayerColorPalette(maxPlayers?: number): string[] {
  const count = maxPlayers === 6 ? 6 : 4;
  return PLAYER_COLORS.slice(0, count).map((c) => c.hex);
}

/** Ludo base/path color name for a given base index, matching the CSS .base-* classes. */
export function getLudoColorName(baseIdx: number, maxPlayers?: number): string {
  const palette = maxPlayers === 6 ? PLAYER_COLORS : PLAYER_COLORS.slice(0, 4);
  return palette[baseIdx]?.id ?? 'red';
}
