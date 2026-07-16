import { createRef, type State } from "veles";

import { Button } from "../design/button";
import {
  closeWindow,
  moveWindow,
  setActiveWindow,
  windowState$,
  type Window,
} from "../state/window";

import styles from "./titlebar.module.css";

export function Titlebar({ window$ }: { window$: State<Window> }) {
  const ref = createRef<HTMLDivElement>();

  function onMouseDown(e: MouseEvent) {
    setActiveWindow(window$.get().id);

    const startingX = e.clientX;
    const startingY = e.clientY;

    const window = window$.get();

    function onMouseMove(e: MouseEvent) {
      const deltaX = e.clientX - startingX;
      const deltaY = e.clientY - startingY;
      const newX = window.position.x + deltaX;
      const newY = window.position.y + deltaY;
      moveWindow(window.id, newX, newY);
    }

    function onMouseUp() {
      document.body.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseup", onMouseUp);
    }

    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      ref={ref}
      class={windowState$.attribute((state) =>
        state.activeWindow === window$.get().id
          ? `${styles.titlebar} ${styles.active}`
          : styles.titlebar,
      )}
      onMouseDown={onMouseDown}
    >
      {window$.renderSelected((value) => value.appId)}

      <Button
        variant="ghost"
        aria-label="Close window"
        onClick={() => closeWindow(window$.get().id)}
      >
        X
      </Button>
    </div>
  );
}
