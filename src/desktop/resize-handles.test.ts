import { describe, expect, test } from "vitest";

import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, type Window } from "../state/window";
import { calculateResizedBounds, type ResizeEdge } from "./resize-handles";

const WINDOW: Window = {
  id: 1,
  appId: "settings",
  maximized: false,
  minimized: false,
  position: { x: 150, y: 100 },
  size: { width: 600, height: 500 },
  zIndex: 1,
};

describe("calculateResizedBounds", () => {
  test.each([
    {
      edge: "right" as ResizeEdge,
      deltaX: 100,
      deltaY: 0,
      expected: { position: { x: 150, y: 100 }, size: { width: 700, height: 500 } },
    },
    {
      edge: "left" as ResizeEdge,
      deltaX: 100,
      deltaY: 0,
      expected: { position: { x: 250, y: 100 }, size: { width: 500, height: 500 } },
    },
    {
      edge: "bottom" as ResizeEdge,
      deltaX: 0,
      deltaY: 100,
      expected: { position: { x: 150, y: 100 }, size: { width: 600, height: 600 } },
    },
    {
      edge: "top" as ResizeEdge,
      deltaX: 0,
      deltaY: 100,
      expected: { position: { x: 150, y: 200 }, size: { width: 600, height: 400 } },
    },
    {
      edge: "top-right" as ResizeEdge,
      deltaX: 100,
      deltaY: 100,
      expected: { position: { x: 150, y: 200 }, size: { width: 700, height: 400 } },
    },
    {
      edge: "bottom-right" as ResizeEdge,
      deltaX: 100,
      deltaY: 100,
      expected: { position: { x: 150, y: 100 }, size: { width: 700, height: 600 } },
    },
    {
      edge: "bottom-left" as ResizeEdge,
      deltaX: 100,
      deltaY: 100,
      expected: { position: { x: 250, y: 100 }, size: { width: 500, height: 600 } },
    },
    {
      edge: "top-left" as ResizeEdge,
      deltaX: 100,
      deltaY: 100,
      expected: { position: { x: 250, y: 200 }, size: { width: 500, height: 400 } },
    },
  ])("resizes the $edge edge", ({ edge, deltaX, deltaY, expected }) => {
    expect(calculateResizedBounds(WINDOW, edge, deltaX, deltaY)).toEqual(expected);
  });

  test("keeps the opposite edges anchored at the minimum size", () => {
    expect(calculateResizedBounds(WINDOW, "left", 1_000, 0)).toEqual({
      position: { x: WINDOW.position.x + WINDOW.size.width - MIN_WINDOW_WIDTH, y: 100 },
      size: { width: MIN_WINDOW_WIDTH, height: 500 },
    });
    expect(calculateResizedBounds(WINDOW, "top", 0, 1_000)).toEqual({
      position: { x: 150, y: WINDOW.position.y + WINDOW.size.height - MIN_WINDOW_HEIGHT },
      size: { width: 600, height: MIN_WINDOW_HEIGHT },
    });
    expect(calculateResizedBounds(WINDOW, "top-left", 1_000, 1_000)).toEqual({
      position: {
        x: WINDOW.position.x + WINDOW.size.width - MIN_WINDOW_WIDTH,
        y: WINDOW.position.y + WINDOW.size.height - MIN_WINDOW_HEIGHT,
      },
      size: { width: MIN_WINDOW_WIDTH, height: MIN_WINDOW_HEIGHT },
    });
  });
});
