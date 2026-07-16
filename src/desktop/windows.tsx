import { windowState$, type Window, type AppId, setActiveWindow } from "../state/window";
import { ResizeHandles } from "./resize-handles";
import { Titlebar } from "./titlebar";

import { MarkdownReaderApp } from "../apps/markdown-reader";
import { SpinnyApp } from "../apps/spinny";
import { SudokuApp } from "../apps/sudoku";

import type { State } from "veles";

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
      class="window"
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
      <Titlebar window$={window$} />
      <div class="window-content">
        {window$.renderSelected(
          (value) => value.appId,
          (appId) => (
            <Application appId={appId} />
          ),
        )}
      </div>
      <ResizeHandles window$={window$} />
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
