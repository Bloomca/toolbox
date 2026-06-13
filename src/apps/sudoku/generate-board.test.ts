import { expect, test, describe } from "vitest";

import { generateBoard, type Row } from "./generate-board";

// validates both rows and columns
function validateRow(row: number[]): boolean {
  if (row.length !== 9) return false;
  const dict = new Set<number>();

  for (const value of row) {
    if (dict.has(value)) return false;
    dict.add(value);
  }

  return true;
}

describe("generate board", () => {
  test("all rows are correct", () => {
    const board = generateBoard();

    for (const row of board) {
      expect(validateRow(row)).toBe(true);
    }
  });

  test("all columns are correct", () => {
    const board = generateBoard();

    for (let i = 0; i < 9; i++) {
      const column = board.map((row) => row[i]);
      expect(validateRow(column)).toBe(true);
    }
  });
});
