import { onMount } from "veles";

import { parseSharedSpinnyListId } from "../apps/spinny/share";
import { openApp, setActiveWindow, windowState$ } from "../state/window";
import { AppIcons } from "./app-icons";
import { Windows } from "./windows";

export function Desktop() {
  onMount(() => openSpinnyForSharedList(window.location.href));

  return (
    <div class="desktop">
      <AppIcons />
      <Windows />
    </div>
  );
}

export function openSpinnyForSharedList(url: string) {
  if (!parseSharedSpinnyListId(url)) return;

  const existingWindow = windowState$.get().windows.find((window) => window.appId === "spinny");
  if (existingWindow) setActiveWindow(existingWindow.id);
  else openApp({ appId: "spinny" });
}
