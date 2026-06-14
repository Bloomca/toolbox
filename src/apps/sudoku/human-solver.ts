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

export type SudokuPlacementTechnique = "fullHouse" | "nakedSingle" | "hiddenSingle";
export type SudokuEliminationTechnique = "pointingCandidates" | "boxLineReduction" | "nakedPair";
export type SudokuTechnique = SudokuPlacementTechnique | SudokuEliminationTechnique;
export type SudokuUnitType = "row" | "column" | "square";

export type SudokuUnit = {
  type: SudokuUnitType;
  index: number;
};

export type CellPosition = {
  row: number;
  col: number;
};

export type CandidateElimination = CellPosition & {
  value: SudokuDigit;
};

export type SudokuPlacementMove = {
  technique: SudokuPlacementTechnique;
  row: number;
  col: number;
  value: SudokuDigit;
  unit?: SudokuUnit;
};

export type SudokuEliminationMove = {
  technique: SudokuEliminationTechnique;
  unit: SudokuUnit;
  cells: CellPosition[];
  eliminations: CandidateElimination[];
  value?: SudokuDigit;
  values?: SudokuDigit[];
  targetUnit?: SudokuUnit;
};

export type SudokuMove = SudokuPlacementMove | SudokuEliminationMove;

const digits: SudokuDigit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const easyTechniques: readonly SudokuTechnique[] = [
  "fullHouse",
  "nakedSingle",
  "hiddenSingle",
];

export const normalTechniques: readonly SudokuTechnique[] = [
  ...easyTechniques,
  "pointingCandidates",
  "boxLineReduction",
  "nakedPair",
];

export function findMoves(
  board: SudokuGrid,
  techniques: readonly SudokuTechnique[] = easyTechniques,
): SudokuMove[] {
  const result: SudokuMove[] = [];
  const seenMoves = new Set<string>();

  for (const technique of techniques) {
    const moves = findMovesForTechnique(board, technique);

    for (const move of moves) {
      const key = getDeduplicationKey(move);
      if (seenMoves.has(key)) continue;

      seenMoves.add(key);
      result.push(move);
    }
  }

  return result;
}

export function findFullHouseMoves(board: SudokuGrid): SudokuPlacementMove[] {
  const result: SudokuPlacementMove[] = [];
  const seenMoves = new Set<string>();

  for (const unit of getUnits()) {
    const emptyCells = unit.cells.filter(({ row, col }) => board[row][col] === 0);
    if (emptyCells.length !== 1) continue;

    const missingDigits = getMissingDigits(unit.cells.map(({ row, col }) => board[row][col]));
    if (missingDigits.length !== 1) continue;

    const [{ row, col }] = emptyCells;
    const [value] = missingDigits;
    if (!getCandidates(board, row, col).includes(value)) continue;

    addUniquePlacementMove(result, seenMoves, {
      technique: "fullHouse",
      row,
      col,
      value,
      unit: { type: unit.type, index: unit.index },
    });
  }

  return result;
}

export function findNakedSingleMoves(board: SudokuGrid): SudokuPlacementMove[] {
  const result: SudokuPlacementMove[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const candidates = getCandidates(board, row, col);
      if (candidates.length !== 1) continue;

      result.push({ technique: "nakedSingle", row, col, value: candidates[0] });
    }
  }

  return result;
}

export function findHiddenSingleMoves(board: SudokuGrid): SudokuPlacementMove[] {
  const result: SudokuPlacementMove[] = [];
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
      addUniquePlacementMove(result, seenMoves, {
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

export function findPointingCandidateMoves(board: SudokuGrid): SudokuEliminationMove[] {
  const result: SudokuEliminationMove[] = [];
  const seenMoves = new Set<string>();
  const squareUnits = getUnits().filter((unit) => unit.type === "square");

  for (const square of squareUnits) {
    const existingValues = new Set(square.cells.map(({ row, col }) => board[row][col]));

    for (const digit of digits) {
      if (existingValues.has(digit)) continue;

      const candidateCells = square.cells.filter(
        ({ row, col }) => board[row][col] === 0 && getCandidates(board, row, col).includes(digit),
      );
      if (candidateCells.length < 2) continue;

      const row = getSharedRow(candidateCells);
      if (row !== undefined) {
        addUniqueEliminationMove(
          result,
          seenMoves,
          createPointingCandidateMove(board, square, candidateCells, digit, {
            type: "row",
            index: row,
          }),
        );
      }

      const col = getSharedColumn(candidateCells);
      if (col !== undefined) {
        addUniqueEliminationMove(
          result,
          seenMoves,
          createPointingCandidateMove(board, square, candidateCells, digit, {
            type: "column",
            index: col,
          }),
        );
      }
    }
  }

  return result;
}

export function findBoxLineReductionMoves(board: SudokuGrid): SudokuEliminationMove[] {
  const result: SudokuEliminationMove[] = [];
  const seenMoves = new Set<string>();
  const lineUnits = getUnits().filter((unit) => unit.type === "row" || unit.type === "column");

  for (const line of lineUnits) {
    const existingValues = new Set(line.cells.map(({ row, col }) => board[row][col]));

    for (const digit of digits) {
      if (existingValues.has(digit)) continue;

      const candidateCells = line.cells.filter(
        ({ row, col }) => board[row][col] === 0 && getCandidates(board, row, col).includes(digit),
      );
      if (candidateCells.length < 2) continue;

      const squareIndex = getSharedSquare(candidateCells);
      if (squareIndex === undefined) continue;

      const move = createBoxLineReductionMove(board, line, candidateCells, digit, squareIndex);
      addUniqueEliminationMove(result, seenMoves, move);
    }
  }

  return result;
}

export function findNakedPairMoves(board: SudokuGrid): SudokuEliminationMove[] {
  const result: SudokuEliminationMove[] = [];
  const seenMoves = new Set<string>();

  for (const unit of getUnits()) {
    const cellsByCandidates = new Map<string, CellPosition[]>();
    const valuesByKey = new Map<string, SudokuDigit[]>();

    for (const { row, col } of unit.cells) {
      const candidates = getCandidates(board, row, col);
      if (candidates.length !== 2) continue;

      const key = candidates.join(":");
      const cells = cellsByCandidates.get(key) ?? [];
      cells.push({ row, col });
      cellsByCandidates.set(key, cells);
      valuesByKey.set(key, candidates);
    }

    for (const [key, cells] of cellsByCandidates.entries()) {
      if (cells.length !== 2) continue;

      const values = valuesByKey.get(key);
      if (!values) continue;

      const eliminations = unit.cells
        .filter((cell) => !cells.some((pairCell) => isSameCell(pairCell, cell)))
        .flatMap(({ row, col }) =>
          getCandidates(board, row, col)
            .filter((candidate) => values.includes(candidate))
            .map((value) => ({ row, col, value })),
        );

      if (eliminations.length === 0) continue;

      addUniqueEliminationMove(result, seenMoves, {
        technique: "nakedPair",
        unit: { type: unit.type, index: unit.index },
        cells,
        values,
        eliminations,
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

type UnitDefinition = SudokuUnit & {
  cells: CellPosition[];
};

function findMovesForTechnique(board: SudokuGrid, technique: SudokuTechnique): SudokuMove[] {
  if (technique === "fullHouse") return findFullHouseMoves(board);
  if (technique === "nakedSingle") return findNakedSingleMoves(board);
  if (technique === "hiddenSingle") return findHiddenSingleMoves(board);
  if (technique === "pointingCandidates") return findPointingCandidateMoves(board);
  if (technique === "boxLineReduction") return findBoxLineReductionMoves(board);

  return findNakedPairMoves(board);
}

function createPointingCandidateMove(
  board: SudokuGrid,
  square: UnitDefinition,
  cells: CellPosition[],
  value: SudokuDigit,
  targetUnit: SudokuUnit,
): SudokuEliminationMove | undefined {
  const eliminations = getCellsForUnit(targetUnit)
    .filter((cell) => getSquareIndex(cell.row, cell.col) !== square.index)
    .filter(
      ({ row, col }) => board[row][col] === 0 && getCandidates(board, row, col).includes(value),
    )
    .map(({ row, col }) => ({ row, col, value }));

  if (eliminations.length === 0) return undefined;

  return {
    technique: "pointingCandidates",
    unit: { type: square.type, index: square.index },
    targetUnit,
    cells,
    value,
    eliminations,
  };
}

function createBoxLineReductionMove(
  board: SudokuGrid,
  line: UnitDefinition,
  cells: CellPosition[],
  value: SudokuDigit,
  squareIndex: number,
): SudokuEliminationMove | undefined {
  const eliminations = getCellsForUnit({ type: "square", index: squareIndex })
    .filter((cell) => !line.cells.some((lineCell) => isSameCell(lineCell, cell)))
    .filter(
      ({ row, col }) => board[row][col] === 0 && getCandidates(board, row, col).includes(value),
    )
    .map(({ row, col }) => ({ row, col, value }));

  if (eliminations.length === 0) return undefined;

  return {
    technique: "boxLineReduction",
    unit: { type: line.type, index: line.index },
    targetUnit: { type: "square", index: squareIndex },
    cells,
    value,
    eliminations,
  };
}

function getUnits(): UnitDefinition[] {
  const units: UnitDefinition[] = [];

  for (let row = 0; row < 9; row++) {
    units.push({
      type: "row",
      index: row,
      cells: getCellsForUnit({ type: "row", index: row }),
    });
  }

  for (let col = 0; col < 9; col++) {
    units.push({
      type: "column",
      index: col,
      cells: getCellsForUnit({ type: "column", index: col }),
    });
  }

  for (let square = 0; square < 9; square++) {
    units.push({
      type: "square",
      index: square,
      cells: getCellsForUnit({ type: "square", index: square }),
    });
  }

  return units;
}

function getCellsForUnit(unit: SudokuUnit): CellPosition[] {
  if (unit.type === "row") {
    return Array.from({ length: 9 }, (_, col) => ({ row: unit.index, col }));
  }

  if (unit.type === "column") {
    return Array.from({ length: 9 }, (_, row) => ({ row, col: unit.index }));
  }

  const rowStart = Math.floor(unit.index / 3) * 3;
  const colStart = (unit.index % 3) * 3;
  const cells: CellPosition[] = [];

  for (let row = rowStart; row < rowStart + 3; row++) {
    for (let col = colStart; col < colStart + 3; col++) {
      cells.push({ row, col });
    }
  }

  return cells;
}

function getColumnValues(board: SudokuGrid, col: number): SudokuCell[] {
  return board.map((row) => row[col]);
}

function getSquareValues(board: SudokuGrid, row: number, col: number): SudokuCell[] {
  return getCellsForUnit({ type: "square", index: getSquareIndex(row, col) }).map(
    (cell) => board[cell.row][cell.col],
  );
}

function getSquareIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function getMissingDigits(values: SudokuCell[]): SudokuDigit[] {
  const existingValues = new Set(values);

  return digits.filter((digit) => !existingValues.has(digit));
}

function getSharedRow(cells: CellPosition[]): number | undefined {
  const [firstCell] = cells;
  if (!firstCell) return undefined;

  return cells.every((cell) => cell.row === firstCell.row) ? firstCell.row : undefined;
}

function getSharedColumn(cells: CellPosition[]): number | undefined {
  const [firstCell] = cells;
  if (!firstCell) return undefined;

  return cells.every((cell) => cell.col === firstCell.col) ? firstCell.col : undefined;
}

function getSharedSquare(cells: CellPosition[]): number | undefined {
  const [firstCell] = cells;
  if (!firstCell) return undefined;

  const squareIndex = getSquareIndex(firstCell.row, firstCell.col);

  return cells.every((cell) => getSquareIndex(cell.row, cell.col) === squareIndex)
    ? squareIndex
    : undefined;
}

function isSameCell(a: CellPosition, b: CellPosition): boolean {
  return a.row === b.row && a.col === b.col;
}

function addUniquePlacementMove(
  moves: SudokuPlacementMove[],
  seenMoves: Set<string>,
  move: SudokuPlacementMove,
) {
  const key = getPlacementMoveKey(move);
  if (seenMoves.has(key)) return;

  seenMoves.add(key);
  moves.push(move);
}

function addUniqueEliminationMove(
  moves: SudokuEliminationMove[],
  seenMoves: Set<string>,
  move: SudokuEliminationMove | undefined,
) {
  if (!move) return;

  const key = getEliminationMoveKey(move);
  if (seenMoves.has(key)) return;

  seenMoves.add(key);
  moves.push(move);
}

function isPlacementMove(move: SudokuMove): move is SudokuPlacementMove {
  return "row" in move;
}

function getDeduplicationKey(move: SudokuMove): string {
  if (isPlacementMove(move)) return `placement:${getPlacementKey(move)}`;

  return `elimination:${getEliminationKey(move.eliminations)}`;
}

function getPlacementMoveKey(move: SudokuPlacementMove): string {
  return `${move.technique}:${getPlacementKey(move)}`;
}

function getEliminationMoveKey(move: SudokuEliminationMove): string {
  return `${move.technique}:${getEliminationKey(move.eliminations)}`;
}

function getPlacementKey(move: SudokuPlacementMove): string {
  return `${move.row}:${move.col}:${move.value}`;
}

function getEliminationKey(eliminations: CandidateElimination[]): string {
  return eliminations.map(({ row, col, value }) => `${row}:${col}:${value}`).join("|");
}
