/** Square centers in the 10x10 serpentine playfield. */
export const getSerpentineCoordinates = (cellNum: number) => {
  const index = cellNum - 1;
  const row = Math.floor(index / 10);
  const colRemainder = index % 10;
  const col = (row % 2 === 1) ? (9 - colRemainder) : colRemainder;
  const cellSize = 100;
  return { x: col * cellSize + 50, y: (9 - row) * cellSize + 50 };
};

/** Keep all pieces countable inside one 100px square, even at match start. */
export const getSnakesTokenSlot = (index: number, count: number) => {
  if (count <= 1) return { x: 0, y: 0, size: 32 };
  const columns = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / columns);
  const spacing = count <= 4 ? 30 : 25;
  return {
    x: (index % columns - (columns - 1) / 2) * spacing,
    y: (Math.floor(index / columns) - (rows - 1) / 2) * spacing,
    size: count <= 4 ? 29 : 23
  };
};
