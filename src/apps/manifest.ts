export type WindowSize = {
  width: number;
  height: number;
};

export type AppDefinition = {
  name: string;
  standalonePath?: `/${string}`;
  preferredWindowSize?: WindowSize;
};

export const APP_MANIFEST = {
  settings: { name: "Settings" },
  sudoku: { name: "Sudoku", standalonePath: "/sudoku" },
  "markdown-reader": { name: "Markdown", standalonePath: "/markdown" },
  spinny: {
    name: "Spinny",
    standalonePath: "/spinny",
    preferredWindowSize: { width: 880, height: 660 },
  },
} satisfies Record<string, AppDefinition>;

export type AppId = keyof typeof APP_MANIFEST;

export const APP_IDS = Object.keys(APP_MANIFEST) as AppId[];

export function getAppDefinition(appId: AppId): AppDefinition {
  return APP_MANIFEST[appId];
}
