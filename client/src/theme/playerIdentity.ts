/** Bot names carry a shared prefix; use the actual name to identify the piece. */
export function getPlayerInitial(name: string | undefined, isBot = false): string {
  const displayName = isBot ? name?.trim().replace(/^bot\s+/i, '') : name?.trim();
  return displayName?.charAt(0).toUpperCase() || '?';
}
