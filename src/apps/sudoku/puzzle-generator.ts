import { countSolutions } from "./correctness-solver";
import { generateBoard } from "./generate-board";
import { cloneGrid, shuffle } from "./utils";

import type { SudokuGrid } from "./types";

export type GeneratePuzzleOptions = {
  targetClues?: number;
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
  const targetClues = options.targetClues ?? 40;
  validateTargetClues(targetClues);

  const solution = options.solution ? cloneGrid(options.solution) : generateBoard();
  const puzzle = cloneGrid(solution);
  let clues = 81;

  for (const { row, col } of shuffle(generateCellPositions())) {
    if (clues <= targetClues) break;

    const previousValue = puzzle[row][col];
    puzzle[row][col] = 0;

    if (countSolutions(puzzle) === 1) {
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

function validateTargetClues(targetClues: number) {
  if (!Number.isInteger(targetClues) || targetClues < 0 || targetClues > 81) {
    throw new Error("targetClues must be an integer between 0 and 81");
  }
}
