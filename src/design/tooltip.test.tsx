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

    expect(container.querySelector("button")?.textContent).toBe("Target");
    expect(container.querySelector('[role="tooltip"]')?.textContent).toBe("Helpful text");
    expect(
      container.querySelector('[role="tooltip"]')?.getAttribute("data-toolbox-tooltip-placement"),
    ).toBe("right");
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

    expect(container.querySelector('[role="tooltip"]')?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("button")).not.toBeNull();
  });
});
