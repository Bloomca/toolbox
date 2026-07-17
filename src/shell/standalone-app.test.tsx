/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { mountStandaloneApp } from "./standalone-app";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
  document.title = "";
});

describe("standalone app shell", () => {
  test("mounts an application full screen and sets its page title", () => {
    const container = document.createElement("div");
    container.id = "app";
    document.body.append(container);

    unmount = mountStandaloneApp({
      name: "Example",
      component: <div data-example-app="">Application content</div>,
    });

    const shell = container.querySelector<HTMLElement>("main.standalone-app");
    const appContainer = shell?.querySelector<HTMLElement>(".standalone-app-container");
    expect(document.title).toBe("Example · Toolbox");
    expect(appContainer?.classList.contains("standalone")).toBe(true);
    expect(appContainer?.textContent).toBe("Application content");
    expect(appContainer?.querySelector("[data-example-app]")).not.toBeNull();
  });
});
