/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";
import { attachComponent } from "veles";

import { Tooltip } from "./tooltip";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("Tooltip", () => {
  test("renders accessible tooltip content and its child", () => {
    const container = document.createElement("div");
    document.body.append(container);
    unmount = attachComponent({
      htmlElement: container,
      component: (
        <Tooltip content="Helpful text" placement="right">
          <button type="button">Target</button>
        </Tooltip>
      ),
    });

    const target = container.querySelector<HTMLElement>("[data-toolbox-tooltip]");
    const button = container.querySelector<HTMLButtonElement>("button");
    const tooltip = document.body.querySelector<HTMLElement>('[role="tooltip"]');
    expect(button?.textContent).toBe("Target");
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(tooltip?.textContent).toBe("Helpful text");
    expect(tooltip?.getAttribute("data-toolbox-tooltip-placement")).toBe("right");

    target?.dispatchEvent(new MouseEvent("mouseenter"));
    expect(tooltip?.hasAttribute("data-visible")).toBe(true);
    expect(tooltip?.style.left).not.toBe("");
    expect(tooltip?.style.top).not.toBe("");

    button?.click();
    expect(tooltip?.hasAttribute("data-visible")).toBe(false);

    target?.dispatchEvent(new MouseEvent("mouseleave"));
    button?.focus();
    expect(tooltip?.hasAttribute("data-visible")).toBe(true);
    button?.click();
    expect(tooltip?.hasAttribute("data-visible")).toBe(false);
  });

  test("can hide tooltip content without removing its target", () => {
    const container = document.createElement("div");
    document.body.append(container);
    unmount = attachComponent({
      htmlElement: container,
      component: (
        <Tooltip content="Unavailable reason" hidden>
          <button type="button">Target</button>
        </Tooltip>
      ),
    });

    expect(document.body.querySelector('[role="tooltip"]')?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("button")).not.toBeNull();
  });
});
