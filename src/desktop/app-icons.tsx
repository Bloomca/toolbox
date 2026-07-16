import { openApp, type AppId } from "../state/window";

export function AppIcons() {
  return (
    <div class="app-icons-container">
      <AppIcon name="Settings" appId="settings" />
      <AppIcon name="Sudoku" appId="sudoku" />
      <AppIcon name="Markdown" appId="markdown-reader" />
    </div>
  );
}

function AppIcon({ name, appId }: { name: string; appId: AppId }) {
  return (
    <div class="app-icon" onDblClick={() => openApp({ appId })}>
      {name}
    </div>
  );
}
