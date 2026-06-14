import { countSolutions } from "./correctness-solver";
import { generateBoard } from "./generate-board";
import { solveWithTechniques } from "./human-solver";
import { cloneGrid, shuffle } from "./utils";

import type { SudokuGrid } from "./types";
import type { SudokuTechnique } from "./human-solver";

export type GeneratePuzzleConstraints = {
  minimumClues?: number;
  allowedTechniques?: readonly SudokuTechnique[];
};

export type GeneratePuzzleOptions = {
  constraints?: GeneratePuzzleConstraints;
  solution?: SudokuGrid;
};

export type SudokuPuzzle = {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  clues: number;
};

type CellPosition = {
  row: number;
  col: number;
};

export function generatePuzzle(options: GeneratePuzzleOptions = {}): SudokuPuzzle {
  const minimumClues = options.constraints?.minimumClues ?? 40;
  const allowedTechniques = options.constraints?.allowedTechniques ?? [];
  validateMinimumClues(minimumClues);

  const solution = options.solution ? cloneGrid(options.solution) : generateBoard();
  const puzzle = cloneGrid(solution);
  let clues = 81;

  for (const { row, col } of shuffle(generateCellPositions())) {
    if (clues <= minimumClues) break;

    const previousValue = puzzle[row][col];
    puzzle[row][col] = 0;

    if (
      countSolutions(puzzle, 2) === 1 &&
      satisfiesTechniqueConstraints(puzzle, allowedTechniques)
    ) {
      clues--;
    } else {
      puzzle[row][col] = previousValue;
    }
  }

  return { puzzle, solution, clues };
}

export function countClues(puzzle: SudokuGrid): number {
  return puzzle.reduce((total, row) => total + row.filter((value) => value !== 0).length, 0);
}

function generateCellPositions(): CellPosition[] {
  const positions: CellPosition[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }

  return positions;
}

function satisfiesTechniqueConstraints(
  puzzle: SudokuGrid,
  allowedTechniques: readonly SudokuTechnique[],
): boolean {
  if (allowedTechniques.length === 0) return true;

  return solveWithTechniques(puzzle, allowedTechniques).solved;
}

function validateMinimumClues(minimumClues: number) {
  if (!Number.isInteger(minimumClues) || minimumClues < 0 || minimumClues > 81) {
    throw new Error("minimumClues must be an integer between 0 and 81");
  }
}
