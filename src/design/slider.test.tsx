/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
import { attachComponent } from "veles";

import { Slider } from "./slider";

let unmount: (() => void) | undefined;

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("Slider", () => {
  test("renders a configured accessible range input", () => {
    const container = renderSlider(
      <Slider aria-label="Choice weight" min={1} max={9} step={1} value={5} />,
    );
    const slider = container.querySelector<HTMLInputElement>("input");

    expect(slider?.type).toBe("range");
    expect(slider?.getAttribute("aria-label")).toBe("Choice weight");
    expect(slider?.min).toBe("1");
    expect(slider?.max).toBe("9");
    expect(slider?.step).toBe("1");
    expect(slider?.value).toBe("5");
    expect(slider?.hasAttribute("data-toolbox-slider")).toBe(true);
  });

  test("forwards input events", () => {
    const onInput = vi.fn();
    const container = renderSlider(
      <Slider aria-label="Choice weight" min={1} max={9} value={5} onInput={onInput} />,
    );
    const slider = container.querySelector<HTMLInputElement>("input");
    if (!slider) throw new Error("Expected a slider.");

    slider.value = "8";
    slider.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onInput).toHaveBeenCalledOnce();
    expect(onInput.mock.calls[0][0].target.value).toBe("8");
  });
});

function renderSlider(component: ReturnType<typeof Slider>): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component });
  return container;
}
