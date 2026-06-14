import { describe, expect, test } from "vitest";

import { countSolutions, hasUniqueSolution } from "./correctness-solver";

import type { SudokuGrid, SudokuCell } from "./types";

const solvedBoard: SudokuGrid = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1],
  [5, 6, 7, 8, 9, 1, 2, 3, 4],
  [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2],
  [6, 7, 8, 9, 1, 2, 3, 4, 5],
  [9, 1, 2, 3, 4, 5, 6, 7, 8],
];

function cloneGrid(board: SudokuGrid): SudokuGrid {
  return board.map((row) => [...row]) as SudokuGrid;
}

function withCell(board: SudokuGrid, row: number, col: number, value: SudokuCell): SudokuGrid {
  const result = cloneGrid(board);
  result[row][col] = value;
  return result;
}

function withoutValues(board: SudokuGrid, values: Set<SudokuCell>): SudokuGrid {
  return board.map((row) => row.map((value) => (values.has(value) ? 0 : value))) as SudokuGrid;
}

describe("countSolutions", () => {
  test("returns 1 for an already solved valid board", () => {
    expect(countSolutions(solvedBoard)).toBe(1);
  });

  test("returns 1 for a puzzle with one missing cell", () => {
    const puzzle = withCell(solvedBoard, 0, 0, 0);

    expect(countSolutions(puzzle)).toBe(1);
  });

  test("returns 0 for a board with contradictory clues", () => {
    const invalidPuzzle = withCell(solvedBoard, 0, 0, 2);

    expect(countSolutions(invalidPuzzle)).toBe(0);
  });

  test("stops after maxSolutions when a puzzle has multiple solutions", () => {
    const ambiguousPuzzle = withoutValues(solvedBoard, new Set([1, 2]));

    expect(countSolutions(ambiguousPuzzle, 2)).toBe(2);
  });
});

describe("hasUniqueSolution", () => {
  test("returns true for a puzzle with exactly one solution", () => {
    const puzzle = withCell(solvedBoard, 0, 0, 0);

    expect(hasUniqueSolution(puzzle)).toBe(true);
  });

  test("returns false for a puzzle with multiple solutions", () => {
    const ambiguousPuzzle = withoutValues(solvedBoard, new Set([1, 2]));

    expect(hasUniqueSolution(ambiguousPuzzle)).toBe(false);
  });
});
