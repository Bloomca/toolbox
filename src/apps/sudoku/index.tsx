import { createState } from "veles";

import { generatePuzzle, type SudokuPuzzle, type GeneratePuzzleOptions } from "./puzzle-generator";

import styles from "./style.module.css";

export function SudokuApp() {
  const state$ = createState<{ board: SudokuPuzzle | null }>({
    board: null,
  });

  function onBoardCreated(board: SudokuPuzzle) {
    state$.update((value) => ({ ...value, board }));
  }

  return (
    <div>
      {state$.render(({ board }) =>
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
  return (
    <div class={styles.board}>
      {board.puzzle.flatMap((row) =>
        row.map((value) => <div class={styles.cell}>{value === 0 ? "" : value}</div>),
      )}
    </div>
  );
}
