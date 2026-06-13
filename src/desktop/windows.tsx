import { windowState$, type Window, type AppId, setActiveWindow } from "../state/window";
import { Titlebar } from "./titlebar";

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
      onClick={() => {
        setActiveWindow(window$.get().id);
      }}
    >
      <Titlebar window$={window$} />
      {window$.render((value) => (
        <Application appId={value.appId} />
      ))}
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
    default:
      // TODO: add exhaustive check
      return null;
  }
}
