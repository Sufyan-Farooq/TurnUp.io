/** Slot centers stay inside even the narrow 74px side tiles at full occupancy. */
export const getMonopolyTokenSlot = (index: number, count: number) => {
  if (count <= 1) return { x: 0, y: 0, size: 26 };
  if (count === 2) return { x: index === 0 ? -15 : 15, y: 0, size: 25 };
  if (count === 3) {
    const slots = [[-15, -13], [15, -13], [0, 15]];
    return { x: slots[index][0], y: slots[index][1], size: 24 };
  }
  if (count === 4) {
    const slots = [[-15, -15], [15, -15], [-15, 15], [15, 15]];
    return { x: slots[index][0], y: slots[index][1], size: 23 };
  }
  const columns = Math.min(3, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: (column - (columns - 1) / 2) * 21,
    y: (row - (rows - 1) / 2) * 21,
    size: 19
  };
};
