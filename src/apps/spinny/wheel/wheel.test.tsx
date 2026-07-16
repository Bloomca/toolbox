/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test, vi } from "vitest";
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
  vi.restoreAllMocks();
});

describe("Spinny", () => {
  test("renders every hardcoded choice on the wheel", () => {
    const container = mount(<SpinnyApp />);
    const wheel = container.querySelector<HTMLElement>('[role="list"]');
    const labels = Array.from(container.querySelectorAll<HTMLElement>('[role="listitem"]'));
    const segments = Array.from(container.querySelectorAll<HTMLElement>("[data-wheel-segment]"));

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
    expect(segments).toHaveLength(labels.length);
    expect(wheel?.style.background).toContain("conic-gradient");
    expect(segments[0].style.background).toContain("radial-gradient");
    expect(labels[0].style.color).toBe(WHEEL_PALETTE[0].foreground);
  });

  test("spins the wheel and announces the selected choice", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const container = mount(<SpinnyApp />);

    expect(container.querySelector("[data-wheel-segment][data-selected]")).toBeNull();
    expect(container.querySelector("[data-choice-id][data-dimmed]")).toBeNull();
    container.querySelector<HTMLButtonElement>("button")?.click();

    await vi.waitFor(() => {
      expect(container.querySelector('[role="status"]')?.textContent).toMatch(/^Winner: /);
    });
    const winner = container.querySelector('[role="status"]')?.textContent?.replace("Winner: ", "");
    const winnerLabel = Array.from(
      container.querySelectorAll<HTMLElement>("[data-choice-id]"),
    ).find((label) => label.title === winner);
    const selectedSegment = container.querySelector<HTMLElement>(
      "[data-wheel-segment][data-selected]",
    );

    const dimmedLabels = container.querySelectorAll("[data-choice-id][data-dimmed]");

    expect(selectedSegment?.dataset.wheelSegment).toBe(winnerLabel?.dataset.choiceId);
    expect(winnerLabel?.hasAttribute("data-dimmed")).toBe(false);
    expect(dimmedLabels).toHaveLength(8);
    expect(container.querySelector<HTMLElement>('[role="list"]')?.style.background).toContain("d9");
    expect(
      container.querySelector<HTMLElement>("[class*='wheelSpinner']")?.style.transform,
    ).toMatch(/^rotate\(.+deg\)$/);
  });

  test.each([
    { name: "zero choices", choices: [] as WheelChoice[] },
    {
      name: "one choice",
      choices: [{ id: "only", label: "Only choice", weight: 1 }],
    },
  ])("renders a wheel with $name", ({ choices }) => {
    const container = mount(<Wheel choices={choices} />);

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="list"]')).not.toBeNull();
    expect(container.querySelectorAll("[data-wheel-segment]")).toHaveLength(choices.length);
  });

  test("renders an invalid state above the maximum choice count", () => {
    const choices = Array.from({ length: 13 }, (_, index) => ({
      id: String(index),
      label: String(index),
      weight: 1,
    }));
    const container = mount(<Wheel choices={choices} />);

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Spinny supports up to 12 choices.",
    );
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
