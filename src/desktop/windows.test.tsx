/** @vitest-environment happy-dom */

import { afterEach, expect, test } from "vitest";
import { attachComponent } from "veles";

import { windowState$ } from "../state/window";
import { Windows } from "./windows";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
  windowState$.set({ windows: [], activeWindow: null });
});

test("renders window content inside its confirmation provider", () => {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component: <Windows /> });
  windowState$.set({
    windows: [
      {
        id: 1,
        maximized: false,
        minimized: false,
        position: { x: 10, y: 10 },
        size: { width: 600, height: 675 },
        appId: "sudoku",
        zIndex: 1,
      },
    ],
    activeWindow: 1,
  });

  expect(container.querySelector('[aria-label="Close window"]')).not.toBeNull();
  expect(container.textContent).toContain("sudoku");
  expect(container.textContent).toContain("Easy");
});
