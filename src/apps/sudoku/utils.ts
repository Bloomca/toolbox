import { SudokuRow } from "./types";

export function generateExistingColumns(previousRows: SudokuRow[]): Set<number>[] {
  const result: Set<number>[] = [];

  for (let i = 0; i < 9; i++) {
    const set = new Set<number>();

    for (const row of previousRows) {
      set.add(row[i]);
    }

    result.push(set);
  }

  return result;
}

export function generateExistingSquares(previousRows: SudokuRow[]): Set<number>[] {
  const result: Set<number>[] = [new Set(), new Set(), new Set()];

  const relevantRows = previousRows.slice(Math.floor(previousRows.length / 3) * 3);

  for (const row of relevantRows) {
    for (let i = 0; i < 9; i++) {
      const value = row[i];
      const setNumber = Math.floor(i / 3);
      result[setNumber].add(value);
    }
  }

  return result;
}
