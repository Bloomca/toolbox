import { APP_IDS, getAppDefinition, type AppId } from "../apps/manifest";
import { openApp } from "../state/window";

export function AppIcons() {
  return (
    <div class="app-icons-container">
      {APP_IDS.map((appId) => (
        <AppIcon name={getAppDefinition(appId).name} appId={appId} />
      ))}
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
