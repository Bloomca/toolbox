type Row = [number, number, number, number, number, number, number, number, number];
type Grid = [Row, Row, Row, Row, Row, Row, Row, Row, Row];

export function generateBoard(): Grid {
  const rows: Row[] = [];
  for (let i = 0; i < 9; i++) {
    const newRow = generateRow(rows);
    rows.push(newRow);
  }

  return rows as Grid;
}

export function generateRow(previousRows: Row[]): Row {
  const columns = generateExistingColumns(previousRows);
  const row: number[] = [];
  const remaining = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  function fillColumn(col: number = 0): boolean {
    if (col === 9) return true;

    const candidates = shuffle([...remaining].filter((n) => !columns[col].has(n)));

    for (const candidate of candidates) {
      row[col] = candidate;
      remaining.delete(candidate);

      // this means that we found a valid combination
      if (fillColumn(col + 1)) return true;

      // this means that the candidate is not suitable
      // so we are trying the next candidate
      remaining.add(candidate);
      delete row[col];
    }

    return false;
  }

  if (!fillColumn()) throw new Error("Could not generate a row");

  return row as Row;
}

function generateExistingColumns(previousRows: Row[]): Set<number>[] {
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

function shuffle<T>(arr: T[]) {
  const newArray: T[] = [];
  while (arr.length) {
    const element = pickRandomElementFromArray(arr);
    newArray.push(element);
  }

  return newArray;
}

function pickRandomElementFromArray<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  const number = array[index];
  array.splice(index, 1);

  return number;
}
