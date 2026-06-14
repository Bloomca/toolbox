import { describe, expect, test } from "vitest";

import { hasUniqueSolution } from "./correctness-solver";
import { solveWithTechniques } from "./human-solver";
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
  test("does not remove cells below the minimum clue count", () => {
    const { puzzle, clues } = generatePuzzle({
      solution: solvedBoard,
      constraints: { minimumClues: 80 },
    });

    expect(clues).toBe(80);
    expect(countClues(puzzle)).toBe(80);
  });

  test("keeps a unique solution after removing cells", () => {
    const { puzzle } = generatePuzzle({
      solution: solvedBoard,
      constraints: { minimumClues: 80 },
    });

    expect(hasUniqueSolution(puzzle)).toBe(true);
  });

  test("keeps disclosed values equal to the solution", () => {
    const { puzzle, solution } = generatePuzzle({
      solution: solvedBoard,
      constraints: { minimumClues: 80 },
    });

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] === 0) continue;

        expect(puzzle[row][col]).toBe(solution[row][col]);
      }
    }
  });

  test("keeps puzzles solvable by the allowed techniques", () => {
    const { puzzle } = generatePuzzle({
      solution: solvedBoard,
      constraints: { minimumClues: 80, allowedTechniques: ["fullHouse"] },
    });

    expect(solveWithTechniques(puzzle, ["fullHouse"]).solved).toBe(true);
  });

  test("treats an empty allowed techniques list as unrestricted", () => {
    const { puzzle, clues } = generatePuzzle({
      solution: solvedBoard,
      constraints: { minimumClues: 80, allowedTechniques: [] },
    });

    expect(clues).toBe(80);
    expect(hasUniqueSolution(puzzle)).toBe(true);
  });

  test("rejects invalid minimum clue counts", () => {
    expect(() => generatePuzzle({ constraints: { minimumClues: -1 } })).toThrow();
    expect(() => generatePuzzle({ constraints: { minimumClues: 82 } })).toThrow();
    expect(() => generatePuzzle({ constraints: { minimumClues: 1.5 } })).toThrow();
  });
});
