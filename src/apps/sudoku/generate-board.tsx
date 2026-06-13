type Row = [number, number, number, number, number, number, number, number, number];
type Grid = [Row, Row, Row, Row, Row, Row, Row, Row, Row];

export function generateBoard(): Grid {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fillCell(cellIndex: number = 0): boolean {
    if (cellIndex === 81) return true;

    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;

    const candidates = getCandidates(row, col);

    for (const candidate of candidates) {
      board[row][col] = candidate;

      if (fillCell(cellIndex + 1)) return true;

      board[row][col] = 0;
    }

    return false;
  }

  function getCandidates(row: number, col: number): number[] {
    const previousRows = board.slice(0, row) as Row[];
    const existingColumns = generateExistingColumns(previousRows);
    const existingSquares = generateExistingSquares(previousRows);
    const existingRow = new Set(board[row]);

    return shuffle(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
        (value) =>
          !existingRow.has(value) &&
          !existingColumns[col].has(value) &&
          !existingSquares[Math.floor(col / 3)].has(value),
      ),
    );
  }

  if (!fillCell()) throw new Error("Could not generate a board");

  return board as Grid;
}

function generateExistingColumns(previousRows: Row[]): Set<number>[] {
  const result: Set<number>[] = [];

  for (let i = 0; i < 9; i++) {
    const set = new Set<number>();

    for (const row of previousRows) {
      set.add(row[i]);
    }

    result.push(set);
  }

  return result;
}

function generateExistingSquares(previousRows: Row[]): Set<number>[] {
  const result: Set<number>[] = [new Set(), new Set(), new Set()];

  const relevantRows = previousRows.slice(Math.floor(previousRows.length / 3) * 3);

  for (const row of relevantRows) {
    for (let i = 0; i < 9; i++) {
      const value = row[i];
      const setNumber = Math.floor(i / 3);
      result[setNumber].add(value);
    }
  }

  return result;
}

function shuffle<T>(arr: T[]) {
  const newArray: T[] = [];
  while (arr.length) {
    const element = pickRandomElementFromArray(arr);
    newArray.push(element);
  }

  return newArray;
}

function pickRandomElementFromArray<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  const number = array[index];
  array.splice(index, 1);

  return number;
}
