import { createState } from "veles";

export type AppId = "settings";

let id = 1;

export type Window = {
  id: number;
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

export const windowState$ = createState<State>({
  windows: [],
  activeWindow: null,
});

export function openApp({ appId }: { appId: AppId }) {
  windowState$.update((state) => ({
    ...state,
    windows: state.windows.concat({
      id: id++,
      maximized: false,
      minimized: false,
      position: {
        x: 150,
        y: 150,
      },
      size: {
        width: 500,
        height: 400,
      },
      appId,
    }),
  }));
}
