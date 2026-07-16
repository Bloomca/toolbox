/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";
import { attachComponent } from "veles";

import { SpinnyApp } from "..";
import { Wheel, WHEEL_PALETTE, type WheelChoice } from ".";

let unmount: (() => void) | undefined;

function mount(component: ReturnType<typeof SpinnyApp>): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  unmount = attachComponent({ htmlElement: container, component });
  return container;
}

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.replaceChildren();
});

describe("Spinny", () => {
  test("renders every hardcoded choice on the wheel", () => {
    const container = mount(<SpinnyApp />);
    const wheel = container.querySelector<HTMLElement>('[role="list"]');
    const labels = Array.from(container.querySelectorAll<HTMLElement>('[role="listitem"]'));

    expect(labels.map((label) => label.title)).toEqual([
      "Sun",
      "Water",
      "Earth",
      "Wind",
      "Fire",
      "Sky",
      "Air",
      "Ocean",
      "Sand",
    ]);
    expect(wheel?.style.background).toContain("conic-gradient");
    expect(labels[0].style.color).toBe(WHEEL_PALETTE[0].foreground);
  });

  test.each([
    { name: "zero choices", choices: [] as WheelChoice[] },
    {
      name: "one choice",
      choices: [{ id: "only", label: "Only choice", weight: 1 }],
    },
  ])("renders an invalid state with $name", ({ choices }) => {
    const container = mount(<Wheel choices={choices} />);

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Spinny needs between 2 and 12 choices.",
    );
    expect(container.querySelector('[role="list"]')).toBeNull();
  });

  test("uses choice weights to size the wheel segments", () => {
    const choices: WheelChoice[] = [
      { id: "one", label: "One", weight: 1 },
      { id: "two", label: "Two", weight: 2 },
    ];
    const container = mount(<Wheel choices={choices} />);

    expect(container.querySelector<HTMLElement>('[role="list"]')?.style.background).toContain(
      "120deg",
    );
  });
});

describe("wheel palette", () => {
  test.each(WHEEL_PALETTE)(
    "$background and $foreground have readable text contrast",
    ({ background, foreground }) => {
      expect(contrastRatio(background, foreground)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: string): number {
  const channels = color
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
    );

  if (!channels || channels.length !== 3)
    throw new Error(`Expected a hex color, received ${color}`);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
