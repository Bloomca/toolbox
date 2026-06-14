export type SudokuCell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SudokuRow = [
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
  SudokuCell,
];
export type SudokuGrid = [
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
  SudokuRow,
];
