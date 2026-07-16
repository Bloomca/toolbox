/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { MarkdownReaderApp } from ".";

let unmount: (() => void) | undefined;

function renderApp(): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component: <MarkdownReaderApp /> });
  return container;
}

function dragEvent(type: "dragenter" | "drop", file: File): DragEvent {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const event = new DragEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  return event;
}

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("MarkdownReaderApp", () => {
  test("shows the drop overlay and renders a dropped Markdown file", async () => {
    const container = renderApp();
    const dropTarget = container.querySelector<HTMLElement>("[data-markdown-drop-target]");
    const file = new File(["# Dropped document\n\nLoaded from a file."], "document.md", {
      type: "text/markdown",
    });

    dropTarget?.dispatchEvent(dragEvent("dragenter", file));
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "Drop the Markdown document",
    );

    dropTarget?.dispatchEvent(dragEvent("drop", file));

    await vi.waitFor(() => {
      expect(container.querySelector("h1")?.textContent).toBe("Dropped document");
    });
    expect(container.querySelector("p")?.textContent).toBe("Loaded from a file.");
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
