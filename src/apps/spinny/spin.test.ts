import { describe, expect, test } from "vitest";

import {
  SPIN_CONFIG,
  createInitialRotation,
  createSpinPlan,
  getPointerPosition,
  type SpinConfiguration,
} from "./spin";
import type { WheelChoice } from "./wheel";

const CHOICES: readonly WheelChoice[] = [
  { id: "small", label: "Small", weight: 1 },
  { id: "large", label: "Large", weight: 3 },
];

const TEST_CONFIG: Readonly<SpinConfiguration> = {
  ...SPIN_CONFIG,
  minimumTurns: 2,
  maximumTurns: 2,
  minimumDurationMs: 100,
  maximumDurationMs: 100,
  landingMargin: 0.1,
};

describe("createInitialRotation", () => {
  test("starts with the pointer inside a randomly selected segment", () => {
    const rotation = createInitialRotation(CHOICES, {
      config: TEST_CONFIG,
      random: randomSequence(0.1, 0.5),
    });

    expect(rotation).toBe(315);
    expect(normalizeAngle(45 + rotation)).toBe(TEST_CONFIG.pointerAngleDegrees);
  });
});

describe("createSpinPlan", () => {
  test("selects choices by weight and lands them under the pointer", () => {
    const plan = createSpinPlan(CHOICES, 0, {
      config: TEST_CONFIG,
      random: randomSequence(0.1, 0.5, 0, 0),
    });

    expect(plan.choice.id).toBe("small");
    expect(plan.landingAngle).toBe(45);
    expect(plan.endRotation - plan.startRotation).toBeGreaterThanOrEqual(2 * 360);
    expect(normalizeAngle(plan.landingAngle + plan.endRotation)).toBe(0);
    expect(plan.durationMs).toBe(100);
  });

  test("can select a choice with a larger weight", () => {
    const plan = createSpinPlan(CHOICES, 0, {
      config: TEST_CONFIG,
      random: randomSequence(0.75, 0.5, 0, 0),
    });

    expect(plan.choice.id).toBe("large");
    expect(normalizeAngle(plan.landingAngle + plan.endRotation)).toBe(0);
  });

  test("removes full turns and duration when reduced motion is requested", () => {
    const plan = createSpinPlan(CHOICES, 0, {
      config: TEST_CONFIG,
      random: randomSequence(0.1, 0.5),
      reducedMotion: true,
    });

    expect(plan.endRotation).toBeLessThan(360);
    expect(plan.durationMs).toBe(TEST_CONFIG.reducedMotionDurationMs);
  });
});

describe("getPointerPosition", () => {
  test("places a zero-degree pointer at twelve o'clock", () => {
    expect(getPointerPosition(TEST_CONFIG)).toEqual({
      left: 50,
      top: 50 - TEST_CONFIG.pointerRadiusPercent,
      rotation: 0,
    });
  });
});

function randomSequence(...values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index];
    if (value === undefined) throw new Error("The test did not provide enough random values.");
    index += 1;
    return value;
  };
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
