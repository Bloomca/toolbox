import { generateExistingColumns, generateExistingSquares, shuffle } from "./utils";

import type { SudokuGrid, SudokuRow } from "./types";

export function generateBoard(): SudokuGrid {
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
    const previousRows = board.slice(0, row) as SudokuRow[];
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

  return board as SudokuGrid;
}
