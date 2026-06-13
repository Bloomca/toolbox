import { expect, test, describe } from "vitest";

import { generateBoard } from "./generate-board";

const testRuns = Array.from({ length: 100 }, (_, index) => index + 1);

// validates rows, columns and squares
function validateGroup(group: number[]): boolean {
  if (group.length !== 9) return false;
  const dict = new Set<number>();

  for (const value of group) {
    if (dict.has(value)) return false;
    dict.add(value);
  }

  return true;
}

describe("generate board", () => {
  test.each(testRuns)("all rows are correct %#", () => {
    const board = generateBoard();

    for (const row of board) {
      expect(validateGroup(row)).toBe(true);
    }
  });

  test.each(testRuns)("all columns are correct %#", () => {
    const board = generateBoard();

    for (let i = 0; i < 9; i++) {
      const column = board.map((row) => row[i]);
      expect(validateGroup(column)).toBe(true);
    }
  });

  test.each(testRuns)("all squares are correct %#", () => {
    const board = generateBoard();

    for (let rowStart = 0; rowStart < 9; rowStart += 3) {
      for (let colStart = 0; colStart < 9; colStart += 3) {
        const square: number[] = [];

        for (let row = rowStart; row < rowStart + 3; row++) {
          for (let col = colStart; col < colStart + 3; col++) {
            square.push(board[row][col]);
          }
        }

        expect(validateGroup(square)).toBe(true);
      }
    }
  });
});
