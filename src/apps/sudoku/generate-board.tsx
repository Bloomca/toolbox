type Row = [number, number, number, number, number, number, number, number, number];
type Grid = [Row, Row, Row, Row, Row, Row, Row, Row, Row];

export function generateBoard(): Grid {
  return [
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
    generateRow(),
  ];
}

export function generateRow(): Row {
  const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return [
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
    pickRandomNumberFromArray(availableNumbers),
  ];
}

// warning: this will modify the array in place
function pickRandomNumberFromArray(array: number[]): number {
  const index = Math.floor(Math.random() * array.length);

  const number = array[index];
  array.splice(index, 1);

  return number;
}
