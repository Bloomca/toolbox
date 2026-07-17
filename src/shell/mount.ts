import { attachComponent } from "veles";

import "../main.css";

export type MountableComponent = Parameters<typeof attachComponent>[0]["component"];

export function mountApplication(component: MountableComponent): () => void {
  const container = document.getElementById("app");
  if (!container) throw new Error('Expected an application container with id "app".');

  return attachComponent({ htmlElement: container, component });
}
