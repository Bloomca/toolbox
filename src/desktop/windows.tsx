import { windowState$, type Window, type AppId } from "../state/window";

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
      }))}
    >
      {window$.render((value) => String(value.id))}
    </div>
  );
}

function Application({ appId }: { appId: AppId }) {
  // choose the right application

  switch (appId) {
    case "settings":
      return null;
    default:
      // TODO: add exhaustive check
      return null;
  }
}
