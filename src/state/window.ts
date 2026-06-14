import { createState } from "veles";

export type AppId = "settings" | "sudoku";

// each window needs its own unique ID, because each app
// can have multiple instances
let id = 1;

// Each window needs a zIndex. Instead of re-arranging windows
// each time we change the active window, we simply assign it
// the highest zIndex. We start from 1, so it is deterministic.
// zIndex can be a 32 bit integer, so it is safe to use this approach.
let zIndex = 1;

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
  zIndex: number;
};

type State = {
  windows: Window[];
  activeWindow: number | null;
};

export const windowState$ = createState<State>({
  windows: [],
  activeWindow: null,
});

export function openApp({ appId }: { appId: AppId }) {
  const newId = id++;
  windowState$.update((state) => ({
    ...state,
    windows: state.windows.concat({
      id: newId,
      maximized: false,
      minimized: false,
      position: {
        x: 150,
        y: 150,
      },
      size: {
        width: 600,
        height: 640,
      },
      appId,
      zIndex: zIndex++,
    }),
    activeWindow: state.activeWindow || newId,
  }));
}

export function moveWindow(id: number, newX: number, newY: number) {
  windowState$.update((state) => ({
    ...state,
    windows: state.windows.map((window) =>
      window.id === id
        ? {
            ...window,
            position: { x: newX, y: newY },
          }
        : window,
    ),
  }));
}

export function setActiveWindow(id: number) {
  if (windowState$.get().activeWindow === id) return;

  windowState$.update((state) => ({
    ...state,
    windows: state.windows.map((window) =>
      window.id === id
        ? {
            ...window,
            zIndex: zIndex++,
          }
        : window,
    ),
    activeWindow: id,
  }));
}

export function closeWindow(id: number) {
  windowState$.update((state) => ({
    ...state,
    windows: state.windows.filter((window) => window.id !== id),
    activeWindow: state.activeWindow === id ? null : state.activeWindow,
  }));
}
