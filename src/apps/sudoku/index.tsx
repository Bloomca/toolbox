import { createState } from "veles";

import { generatePuzzle, type SudokuPuzzle, type GeneratePuzzleOptions } from "./puzzle-generator";

import styles from "./style.module.css";

type State = {
  board: SudokuPuzzle | null;
  edits: { [address: string]: string };
};

const state$ = createState<State>({
  board: null,
  edits: {},
});

export function SudokuApp() {
  function onBoardCreated(board: SudokuPuzzle) {
    state$.update((value) => ({ ...value, board }));
  }

  return (
    <div>
      {state$.renderSelected(
        (state) => state.board,
        (board) =>
          board ? <Board board={board} /> : <DifficultyScreen onBoardCreated={onBoardCreated} />,
      )}
    </div>
  );
}

function DifficultyScreen({ onBoardCreated }: { onBoardCreated: (board: SudokuPuzzle) => void }) {
  function createBoard(difficulty: "easy" | "normal" | "hard") {
    if (difficulty === "easy") {
      onBoardCreated(
        generatePuzzle({
          constraints: {
            minimumClues: 50,
            allowedTechniques: [],
          },
        }),
      );
    } else if (difficulty === "normal") {
      onBoardCreated(
        generatePuzzle({
          constraints: {
            minimumClues: 40,
            allowedTechniques: [],
          },
        }),
      );
    } else if (difficulty === "hard") {
      onBoardCreated(
        generatePuzzle({
          constraints: {
            minimumClues: 30,
            allowedTechniques: [],
          },
        }),
      );
    }
  }
  return (
    <div>
      <button onClick={() => createBoard("easy")}>Easy</button>
      <button onClick={() => createBoard("normal")}>Normal</button>
      <button onClick={() => createBoard("hard")}>Hard</button>
    </div>
  );
}

function Board({ board }: { board: SudokuPuzzle }) {
  const solved$ = state$.map(isPuzzleSolved);

  return (
    <div
      class={solved$.attribute(
        (isSolved) => `${styles.board} ${isSolved ? styles.completed : null}`,
      )}
    >
      {board.puzzle.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) =>
          value === 0 ? (
            <EditableCell row={rowIndex} col={columnIndex} />
          ) : (
            <RegularCell value={value} />
          ),
        ),
      )}
    </div>
  );
}

function EditableCell({ row, col }: { row: number; col: number }) {
  const edits$ = state$.map((state) => state.edits);
  return (
    <div class={`${styles.cell} ${styles.editableCell}`}>
      <input
        class={styles.input}
        type="text"
        value={edits$.attribute((edits) => edits[`${row}:${col}`] ?? "")}
        onInput={(e) =>
          state$.update((state) => ({
            ...state,
            edits: { ...state.edits, [`${row}:${col}`]: e.target.value },
          }))
        }
      />
    </div>
  );
}

function RegularCell({ value }: { value: number }) {
  return <div class={styles.cell}>{value}</div>;
}

function isPuzzleSolved({ board, edits }: State): boolean {
  if (!board) return false;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board.puzzle[row][col] === 0) {
        if (board.solution[row][col] !== Number(edits[`${row}:${col}`])) {
          return false;
        }
      }
    }
  }

  return true;
}
