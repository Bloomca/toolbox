import { describe, expect, test } from "vitest";

import {
  findFullHouseMoves,
  findHiddenSingleMoves,
  findMoves,
  findNakedSingleMoves,
  getCandidates,
} from "./human-solver";

import type { SudokuCell, SudokuGrid } from "./types";

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

function withCells(
  board: SudokuGrid,
  cells: Array<{ row: number; col: number; value: SudokuCell }>,
): SudokuGrid {
  const result = board.map((row) => [...row]) as SudokuGrid;

  for (const { row, col, value } of cells) {
    result[row][col] = value;
  }

  return result;
}

describe("human solver techniques", () => {
  test("finds a full house", () => {
    const puzzle = withCells(solvedBoard, [{ row: 0, col: 0, value: 0 }]);

    expect(findFullHouseMoves(puzzle)).toEqual([
      {
        technique: "fullHouse",
        row: 0,
        col: 0,
        value: 1,
        unit: { type: "row", index: 0 },
      },
    ]);
  });

  test("finds a naked single", () => {
    const puzzle = withCells(solvedBoard, [
      { row: 0, col: 0, value: 0 },
      { row: 0, col: 1, value: 0 },
      { row: 1, col: 0, value: 0 },
    ]);

    expect(getCandidates(puzzle, 0, 0)).toEqual([1]);
    expect(findNakedSingleMoves(puzzle)).toContainEqual({
      technique: "nakedSingle",
      row: 0,
      col: 0,
      value: 1,
    });
  });

  test("finds a hidden single", () => {
    const puzzle = withCells(solvedBoard, [
      { row: 0, col: 0, value: 0 },
      { row: 0, col: 1, value: 0 },
      { row: 0, col: 2, value: 0 },
      { row: 0, col: 3, value: 0 },
      { row: 1, col: 0, value: 0 },
    ]);

    expect(getCandidates(puzzle, 0, 0)).toEqual([1, 4]);
    expect(findHiddenSingleMoves(puzzle)).toContainEqual({
      technique: "hiddenSingle",
      row: 0,
      col: 0,
      value: 1,
      unit: { type: "row", index: 0 },
    });
  });

  test("findMoves returns the easiest technique for the same placement", () => {
    const puzzle = withCells(solvedBoard, [{ row: 0, col: 0, value: 0 }]);

    expect(findMoves(puzzle)).toEqual([
      {
        technique: "fullHouse",
        row: 0,
        col: 0,
        value: 1,
        unit: { type: "row", index: 0 },
      },
    ]);
  });
});
