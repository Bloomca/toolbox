import { onUnmount, type State } from "veles";

import {
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  resizeWindow,
  setActiveWindow,
  type Window,
} from "../state/window";

import styles from "./windows.module.css";

export type ResizeEdge =
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"
  | "top-left";

const RESIZE_EDGES: readonly ResizeEdge[] = [
  "top",
  "right",
  "bottom",
  "left",
  "top-right",
  "bottom-right",
  "bottom-left",
  "top-left",
];

export function ResizeHandles({ window$ }: { window$: State<Window> }) {
  return (
    <>
      {RESIZE_EDGES.map((edge) => (
        <ResizeHandle window$={window$} edge={edge} />
      ))}
    </>
  );
}

function ResizeHandle({ window$, edge }: { window$: State<Window>; edge: ResizeEdge }) {
  let stopResizing: (() => void) | undefined;

  onUnmount(() => stopResizing?.());

  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    stopResizing?.();
    setActiveWindow(window$.get().id);

    const initialWindow = window$.get();
    const startingX = event.clientX;
    const startingY = event.clientY;

    function onMouseMove(event: MouseEvent) {
      event.preventDefault();
      const bounds = calculateResizedBounds(
        initialWindow,
        edge,
        event.clientX - startingX,
        event.clientY - startingY,
      );
      resizeWindow(initialWindow.id, bounds);
    }

    function onMouseUp() {
      document.body.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseup", onMouseUp);
      stopResizing = undefined;
    }

    stopResizing = onMouseUp;
    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp);
  }

  return <div class={styles.resizeHandle} data-resize-edge={edge} onMouseDown={onMouseDown} />;
}

export function calculateResizedBounds(
  window: Window,
  edge: ResizeEdge,
  deltaX: number,
  deltaY: number,
): Pick<Window, "position" | "size"> {
  let x = window.position.x;
  let y = window.position.y;
  let width = window.size.width;
  let height = window.size.height;

  const resizesRight = edge === "right" || edge === "top-right" || edge === "bottom-right";
  const resizesLeft = edge === "left" || edge === "top-left" || edge === "bottom-left";
  const resizesBottom = edge === "bottom" || edge === "bottom-left" || edge === "bottom-right";
  const resizesTop = edge === "top" || edge === "top-left" || edge === "top-right";

  if (resizesRight) width = Math.max(MIN_WINDOW_WIDTH, window.size.width + deltaX);
  if (resizesLeft) {
    width = Math.max(MIN_WINDOW_WIDTH, window.size.width - deltaX);
    x = window.position.x + window.size.width - width;
  }
  if (resizesBottom) height = Math.max(MIN_WINDOW_HEIGHT, window.size.height + deltaY);
  if (resizesTop) {
    height = Math.max(MIN_WINDOW_HEIGHT, window.size.height - deltaY);
    y = window.position.y + window.size.height - height;
  }

  return { position: { x, y }, size: { width, height } };
}
