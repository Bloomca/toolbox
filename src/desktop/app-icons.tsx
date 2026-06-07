import { openApp, type AppId } from "../state/window";

export function AppIcons() {
  return (
    <div>
      <AppIcon name="Settings" appId="settings" />
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
