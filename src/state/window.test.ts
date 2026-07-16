import { afterEach, describe, expect, test } from "vitest";

import { DEFAULT_WINDOW_SIZE, openApp, windowState$ } from "./window";

afterEach(() => {
  windowState$.set({ windows: [], activeWindow: null });
});

describe("openApp", () => {
  test("uses the default window size", () => {
    openApp({ appId: "sudoku" });

    expect(windowState$.get().windows[0].size).toEqual(DEFAULT_WINDOW_SIZE);
  });

  test("uses an app's preferred window size", () => {
    openApp({ appId: "spinny" });

    expect(windowState$.get().windows[0].size).toEqual({ width: 560, height: 640 });
  });
});
