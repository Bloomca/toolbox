import { createState } from "veles";

import { getAppDefinition, type AppId, type WindowSize } from "../apps/manifest";

export type { AppId, WindowSize } from "../apps/manifest";

export const MIN_WINDOW_WIDTH = 320;
export const MIN_WINDOW_HEIGHT = 240;

export const DEFAULT_WINDOW_SIZE: Readonly<WindowSize> = {
  width: 600,
  height: 675,
};

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
  size: WindowSize;
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
  const size = getAppDefinition(appId).preferredWindowSize ?? DEFAULT_WINDOW_SIZE;
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
      size: { ...size },
      appId,
      zIndex: zIndex++,
    }),
    activeWindow: newId,
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

export function resizeWindow(id: number, bounds: Pick<Window, "position" | "size">) {
  windowState$.update((state) => ({
    ...state,
    windows: state.windows.map((window) => (window.id === id ? { ...window, ...bounds } : window)),
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
