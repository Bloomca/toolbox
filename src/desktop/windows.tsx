import { windowState$, type Window, type AppId, setActiveWindow } from "../state/window";
import { ResizeHandles } from "./resize-handles";
import { Titlebar } from "./titlebar";

import { MarkdownReaderApp } from "../apps/markdown-reader";
import { SpinnyApp } from "../apps/spinny";
import { SudokuApp } from "../apps/sudoku";

import type { State } from "veles";

import styles from "./windows.module.css";

export function Windows() {
  const windows$ = windowState$.map((state) => state.windows);
  return (
    <>
      {windows$.renderEach({ key: "id" }, ({ elementState: element$ }) => (
        <Window window$={element$} />
      ))}
    </>
  );
}

function Window({ window$ }: { window$: State<Window> }) {
  return (
    <div
      class={styles.container}
      style={window$.attribute((window) => ({
        left: `${window.position.x}px`,
        top: `${window.position.y}px`,
        width: `${window.size.width}px`,
        height: `${window.size.height}px`,
        "z-index": window.zIndex,
      }))}
      data-active={windowState$.attribute((state) => state.activeWindow === window$.get().id)}
      onClick={() => {
        setActiveWindow(window$.get().id);
      }}
    >
      <ResizeHandles window$={window$} />
      <div class={styles.window}>
        <Titlebar window$={window$} />
        <div class={styles.content}>
          {window$.renderSelected(
            (value) => value.appId,
            (appId) => (
              <Application appId={appId} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Application({ appId }: { appId: AppId }) {
  // choose the right application

  switch (appId) {
    case "settings":
      return null;
    case "sudoku":
      return <SudokuApp />;
    case "markdown-reader":
      return <MarkdownReaderApp />;
    case "spinny":
      return <SpinnyApp />;
    default:
      // TODO: add exhaustive check
      return null;
  }
}
