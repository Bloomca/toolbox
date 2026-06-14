import { generateExistingColumns, generateExistingSquares } from "./utils";

import type { SudokuCell, SudokuGrid } from "./types";

function cloneGrid(board: SudokuGrid): SudokuGrid {
  return board.map((row) => [...row]) as SudokuGrid;
}

export function countSolutions(_board: SudokuGrid, _maxSolutions: number = 2): number {
  const board = cloneGrid(_board);
  if (!isValidBoard(board)) return 0;

  let solutions = 0;

  function fillCell(index: number) {
    if (index >= 9 * 9) {
      solutions++;
      return;
    }

    const row = Math.floor(index / 9);
    const col = index % 9;
    const value = board[row][col];

    // means that it already exists
    if (value !== 0) {
      return fillCell(index + 1);
    }

    const candidates = getCandidates(row, col);

    if (candidates.length === 0) return false;

    for (const candidate of candidates) {
      board[row][col] = candidate;

      fillCell(index + 1);
      if (solutions >= _maxSolutions) return;

      board[row][col] = 0;
    }

    return false;
  }

  function getCandidates(row: number, col: number): SudokuCell[] {
    const existingColumns = generateExistingColumns(board);
    const squareRowStart = Math.floor(row / 3) * 3;
    const existingSquares = generateExistingSquares(
      board.slice(squareRowStart, squareRowStart + 3),
    );
    const existingRow = new Set(board[row]);

    const options: SudokuCell[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return options.filter(
      (value) =>
        !existingRow.has(value) &&
        !existingColumns[col].has(value) &&
        !existingSquares[Math.floor(col / 3)].has(value),
    );
  }

  fillCell(0);

  return solutions;
}

export function hasUniqueSolution(_board: SudokuGrid): boolean {
  return countSolutions(_board) === 1;
}

function isValidBoard(board: SudokuGrid): boolean {
  for (let i = 0; i < 9; i++) {
    if (hasDuplicateValues(board[i])) return false;

    const column = board.map((row) => row[i]);
    if (hasDuplicateValues(column)) return false;
  }

  for (let rowStart = 0; rowStart < 9; rowStart += 3) {
    for (let colStart = 0; colStart < 9; colStart += 3) {
      const square: SudokuCell[] = [];

      for (let row = rowStart; row < rowStart + 3; row++) {
        for (let col = colStart; col < colStart + 3; col++) {
          square.push(board[row][col]);
        }
      }

      if (hasDuplicateValues(square)) return false;
    }
  }

  return true;
}

function hasDuplicateValues(values: SudokuCell[]): boolean {
  const seen = new Set<SudokuCell>();

  for (const value of values) {
    if (value === 0) continue;
    if (seen.has(value)) return true;
    seen.add(value);
  }

  return false;
}
