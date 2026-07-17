import { getAppDefinition } from "../apps/manifest";
import { SudokuApp } from "../apps/sudoku";
import { mountStandaloneApp } from "../shell/standalone-app";

mountStandaloneApp({
  name: getAppDefinition("sudoku").name,
  component: <SudokuApp />,
});
