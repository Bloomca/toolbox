import type { SudokuCell, SudokuDigit, SudokuGrid } from "./types";

/**
 * This module detects move in a "human"-like manner to detect potential
 * difficulty. The correctness solver simply bruteforces the board to
 * see if it can be solved in general by guessing, but this does not
 * mean it is particularly fun.
 *
 * There are multiple techniques which are important at the lower level,
 * to make sure it is fun to play.
 */

export type SudokuTechnique = "fullHouse" | "nakedSingle" | "hiddenSingle";
export type SudokuUnitType = "row" | "column" | "square";

export type SudokuUnit = {
  type: SudokuUnitType;
  index: number;
};

export type SudokuMove = {
  technique: SudokuTechnique;
  row: number;
  col: number;
  value: SudokuDigit;
  unit?: SudokuUnit;
};

const digits: SudokuDigit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const easyTechniques: readonly SudokuTechnique[] = [
  "fullHouse",
  "nakedSingle",
  "hiddenSingle",
];

export function findMoves(
  board: SudokuGrid,
  techniques: readonly SudokuTechnique[] = easyTechniques,
): SudokuMove[] {
  const result: SudokuMove[] = [];
  const seenPlacements = new Set<string>();

  for (const technique of techniques) {
    const moves = findMovesForTechnique(board, technique);

    for (const move of moves) {
      const key = getPlacementKey(move);
      if (seenPlacements.has(key)) continue;

      seenPlacements.add(key);
      result.push(move);
    }
  }

  return result;
}

export function findFullHouseMoves(board: SudokuGrid): SudokuMove[] {
  const result: SudokuMove[] = [];
  const seenMoves = new Set<string>();

  for (const unit of getUnits()) {
    const emptyCells = unit.cells.filter(({ row, col }) => board[row][col] === 0);
    if (emptyCells.length !== 1) continue;

    const missingDigits = getMissingDigits(unit.cells.map(({ row, col }) => board[row][col]));
    if (missingDigits.length !== 1) continue;

    const [{ row, col }] = emptyCells;
    const [value] = missingDigits;
    if (!getCandidates(board, row, col).includes(value)) continue;

    addUniqueMove(result, seenMoves, {
      technique: "fullHouse",
      row,
      col,
      value,
      unit: { type: unit.type, index: unit.index },
    });
  }

  return result;
}

export function findNakedSingleMoves(board: SudokuGrid): SudokuMove[] {
  const result: SudokuMove[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const candidates = getCandidates(board, row, col);
      if (candidates.length !== 1) continue;

      result.push({ technique: "nakedSingle", row, col, value: candidates[0] });
    }
  }

  return result;
}

export function findHiddenSingleMoves(board: SudokuGrid): SudokuMove[] {
  const result: SudokuMove[] = [];
  const seenMoves = new Set<string>();

  for (const unit of getUnits()) {
    const existingValues = new Set(unit.cells.map(({ row, col }) => board[row][col]));

    for (const digit of digits) {
      if (existingValues.has(digit)) continue;

      const possibleCells = unit.cells.filter(
        ({ row, col }) => board[row][col] === 0 && getCandidates(board, row, col).includes(digit),
      );

      if (possibleCells.length !== 1) continue;

      const [{ row, col }] = possibleCells;
      addUniqueMove(result, seenMoves, {
        technique: "hiddenSingle",
        row,
        col,
        value: digit,
        unit: { type: unit.type, index: unit.index },
      });
    }
  }

  return result;
}

export function getCandidates(board: SudokuGrid, row: number, col: number): SudokuDigit[] {
  if (board[row][col] !== 0) return [];

  const existingValues = new Set<SudokuCell>([
    ...board[row],
    ...getColumnValues(board, col),
    ...getSquareValues(board, row, col),
  ]);

  return digits.filter((digit) => !existingValues.has(digit));
}

type CellPosition = {
  row: number;
  col: number;
};

type UnitDefinition = SudokuUnit & {
  cells: CellPosition[];
};

function findMovesForTechnique(board: SudokuGrid, technique: SudokuTechnique): SudokuMove[] {
  if (technique === "fullHouse") return findFullHouseMoves(board);
  if (technique === "nakedSingle") return findNakedSingleMoves(board);

  return findHiddenSingleMoves(board);
}

function getUnits(): UnitDefinition[] {
  const units: UnitDefinition[] = [];

  for (let row = 0; row < 9; row++) {
    units.push({
      type: "row",
      index: row,
      cells: Array.from({ length: 9 }, (_, col) => ({ row, col })),
    });
  }

  for (let col = 0; col < 9; col++) {
    units.push({
      type: "column",
      index: col,
      cells: Array.from({ length: 9 }, (_, row) => ({ row, col })),
    });
  }

  for (let rowStart = 0; rowStart < 9; rowStart += 3) {
    for (let colStart = 0; colStart < 9; colStart += 3) {
      const cells: CellPosition[] = [];

      for (let row = rowStart; row < rowStart + 3; row++) {
        for (let col = colStart; col < colStart + 3; col++) {
          cells.push({ row, col });
        }
      }

      units.push({
        type: "square",
        index: getSquareIndex(rowStart, colStart),
        cells,
      });
    }
  }

  return units;
}

function getColumnValues(board: SudokuGrid, col: number): SudokuCell[] {
  return board.map((row) => row[col]);
}

function getSquareValues(board: SudokuGrid, row: number, col: number): SudokuCell[] {
  const result: SudokuCell[] = [];
  const rowStart = Math.floor(row / 3) * 3;
  const colStart = Math.floor(col / 3) * 3;

  for (let currentRow = rowStart; currentRow < rowStart + 3; currentRow++) {
    for (let currentCol = colStart; currentCol < colStart + 3; currentCol++) {
      result.push(board[currentRow][currentCol]);
    }
  }

  return result;
}

function getSquareIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function getMissingDigits(values: SudokuCell[]): SudokuDigit[] {
  const existingValues = new Set(values);

  return digits.filter((digit) => !existingValues.has(digit));
}

function addUniqueMove(moves: SudokuMove[], seenMoves: Set<string>, move: SudokuMove) {
  const key = getMoveKey(move);
  if (seenMoves.has(key)) return;

  seenMoves.add(key);
  moves.push(move);
}

function getMoveKey(move: SudokuMove): string {
  return `${move.technique}:${getPlacementKey(move)}`;
}

function getPlacementKey(move: SudokuMove): string {
  return `${move.row}:${move.col}:${move.value}`;
}
