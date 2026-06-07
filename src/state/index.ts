import { createState } from "veles";

type AppId = "settings";

type Window = {
  maximized: boolean;
  minimized: boolean;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  appId: AppId;
};

type State = {
  windows: Window[];
  activeWindow: Window | null;
};

export const appState$ = createState<State>({
  windows: [],
  activeWindow: null,
});
