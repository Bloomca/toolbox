import { describe, expect, test } from "vitest";

import { hasUniqueSolution } from "./correctness-solver";
import { countClues, generatePuzzle } from "./puzzle-generator";

import type { SudokuGrid } from "./types";

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

describe("generatePuzzle", () => {
  test("removes cells until the target clue count is reached", () => {
    const { puzzle, clues } = generatePuzzle({ solution: solvedBoard, targetClues: 80 });

    expect(clues).toBe(80);
    expect(countClues(puzzle)).toBe(80);
  });

  test("keeps a unique solution after removing cells", () => {
    const { puzzle } = generatePuzzle({ solution: solvedBoard, targetClues: 80 });

    expect(hasUniqueSolution(puzzle)).toBe(true);
  });

  test("keeps disclosed values equal to the solution", () => {
    const { puzzle, solution } = generatePuzzle({ solution: solvedBoard, targetClues: 80 });

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] === 0) continue;

        expect(puzzle[row][col]).toBe(solution[row][col]);
      }
    }
  });

  test("rejects invalid target clue counts", () => {
    expect(() => generatePuzzle({ targetClues: -1 })).toThrow();
    expect(() => generatePuzzle({ targetClues: 82 })).toThrow();
    expect(() => generatePuzzle({ targetClues: 1.5 })).toThrow();
  });
});
