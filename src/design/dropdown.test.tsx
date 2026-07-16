/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";
import { attachComponent } from "veles";

import { Dropdown } from "./dropdown";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("Dropdown", () => {
  test("renders a placeholder and options", () => {
    const container = document.createElement("div");
    document.body.append(container);
    unmount = attachComponent({
      htmlElement: container,
      component: (
        <Dropdown
          aria-label="Example lists"
          placeholder="Choose a list"
          placeholderSelected
          options={[
            { value: "first", label: "First list" },
            { value: "second", label: "Second list", disabled: true },
          ]}
        />
      ),
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    const options = select?.querySelectorAll("option");
    expect(select?.getAttribute("aria-label")).toBe("Example lists");
    expect(Array.from(options ?? [], (option) => option.textContent)).toEqual([
      "Choose a list",
      "First list",
      "Second list",
    ]);
    expect(options?.[0].selected).toBe(true);
    expect(options?.[2].disabled).toBe(true);
  });
});
