import type { WheelChoice } from "./wheel";

export type SpinConfiguration = {
  pointerAngleDegrees: number;
  pointerRadiusPercent: number;
  minimumTurns: number;
  maximumTurns: number;
  minimumDurationMs: number;
  maximumDurationMs: number;
  decelerationPower: number;
  landingMargin: number;
  reducedMotionDurationMs: number;
  pointerBounceDurationMs: number;
  pointerBounceAngleDegrees: number;
};

// Keep the motion and pointer parameters together so Spinny's feel can be tuned in one place.
export const SPIN_CONFIG: Readonly<SpinConfiguration> = {
  pointerAngleDegrees: 0,
  pointerRadiusPercent: 46,
  minimumTurns: 6,
  maximumTurns: 9,
  minimumDurationMs: 4_500,
  maximumDurationMs: 6_200,
  decelerationPower: 2.5,
  landingMargin: 0.15,
  reducedMotionDurationMs: 0,
  pointerBounceDurationMs: 420,
  pointerBounceAngleDegrees: 11,
};

export type SpinPlan = {
  choice: WheelChoice;
  landingAngle: number;
  startRotation: number;
  endRotation: number;
  durationMs: number;
};

type RandomizedSpinOptions = {
  config?: Readonly<SpinConfiguration>;
  random?: () => number;
};

type SpinPlanOptions = RandomizedSpinOptions & {
  reducedMotion?: boolean;
};

export type RotationAnimation = {
  finished: Promise<boolean>;
  cancel: () => void;
};

export function createInitialRotation(
  choices: readonly WheelChoice[],
  { config = SPIN_CONFIG, random = secureRandom }: RandomizedSpinOptions = {},
): number {
  const { landingAngle } = createLanding(choices, config, random);
  return normalizeAngle(config.pointerAngleDegrees - landingAngle);
}

export function createSpinPlan(
  choices: readonly WheelChoice[],
  currentRotation: number,
  { config = SPIN_CONFIG, random = secureRandom, reducedMotion = false }: SpinPlanOptions = {},
): SpinPlan {
  const { choice, landingAngle } = createLanding(choices, config, random);
  const turns = reducedMotion
    ? 0
    : randomInteger(config.minimumTurns, config.maximumTurns, random());
  const alignment = normalizeAngle(
    config.pointerAngleDegrees - landingAngle - normalizeAngle(currentRotation),
  );
  const durationMs = reducedMotion
    ? config.reducedMotionDurationMs
    : randomBetween(config.minimumDurationMs, config.maximumDurationMs, random());

  return {
    choice,
    landingAngle,
    startRotation: currentRotation,
    endRotation: currentRotation + turns * 360 + alignment,
    durationMs,
  };
}

export function animateRotation(
  element: HTMLElement,
  plan: SpinPlan,
  config: Readonly<SpinConfiguration> = SPIN_CONFIG,
): RotationAnimation {
  if (plan.durationMs <= 0) {
    setRotation(element, plan.endRotation);
    return { finished: Promise.resolve(true), cancel: () => undefined };
  }

  let animationFrame: number | undefined;
  let complete: ((finished: boolean) => void) | undefined;
  let settled = false;
  let startTime: number | undefined;

  const finished = new Promise<boolean>((resolve) => {
    complete = resolve;
  });

  function settle(result: boolean) {
    if (settled) return;
    settled = true;
    complete?.(result);
  }

  function frame(timestamp: number) {
    startTime ??= timestamp;
    const elapsed = timestamp - startTime;
    const time = Math.min(1, elapsed / plan.durationMs);
    const progress = 1 - Math.pow(1 - time, config.decelerationPower);
    const rotation = plan.startRotation + (plan.endRotation - plan.startRotation) * progress;
    setRotation(element, rotation);

    if (time < 1) {
      animationFrame = requestAnimationFrame(frame);
    } else {
      setRotation(element, plan.endRotation);
      settle(true);
    }
  }

  setRotation(element, plan.startRotation);
  animationFrame = requestAnimationFrame(frame);

  return {
    finished,
    cancel() {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      settle(false);
    },
  };
}

export function animatePointer(
  element: HTMLElement,
  config: Readonly<SpinConfiguration> = SPIN_CONFIG,
): Animation | undefined {
  if (config.pointerBounceDurationMs <= 0) return undefined;

  const angle = config.pointerBounceAngleDegrees;
  return element.animate(
    [
      { transform: "rotate(0deg)" },
      { transform: `rotate(${-angle}deg)` },
      { transform: `rotate(${angle * 0.55}deg)` },
      { transform: `rotate(${-angle * 0.25}deg)` },
      { transform: "rotate(0deg)" },
    ],
    {
      duration: config.pointerBounceDurationMs,
      easing: "ease-out",
    },
  );
}

export function getPointerPosition(config: Readonly<SpinConfiguration> = SPIN_CONFIG): {
  left: number;
  top: number;
  rotation: number;
} {
  const radians = (config.pointerAngleDegrees * Math.PI) / 180;
  return {
    left: 50 + config.pointerRadiusPercent * Math.sin(radians),
    top: 50 - config.pointerRadiusPercent * Math.cos(radians),
    rotation: config.pointerAngleDegrees,
  };
}

function createLanding(
  choices: readonly WheelChoice[],
  config: Readonly<SpinConfiguration>,
  random: () => number,
): { choice: WheelChoice; landingAngle: number } {
  const choice = selectWeightedChoice(choices, random());
  const { startAngle, endAngle } = getChoiceAngles(choices, choice);
  const segmentAngle = endAngle - startAngle;
  const margin = segmentAngle * config.landingMargin;
  const landingAngle = startAngle + margin + random() * (segmentAngle - margin * 2);
  return { choice, landingAngle };
}

function selectWeightedChoice(choices: readonly WheelChoice[], random: number): WheelChoice {
  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
  let target = random * totalWeight;

  for (const choice of choices) {
    target -= choice.weight;
    if (target < 0) return choice;
  }

  return choices[choices.length - 1];
}

function getChoiceAngles(
  choices: readonly WheelChoice[],
  selectedChoice: WheelChoice,
): { startAngle: number; endAngle: number } {
  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
  let startAngle = 0;

  for (const choice of choices) {
    const endAngle = startAngle + (choice.weight / totalWeight) * 360;
    if (choice === selectedChoice) return { startAngle, endAngle };
    startAngle = endAngle;
  }

  throw new Error("The selected choice does not belong to this wheel.");
}

function randomInteger(minimum: number, maximum: number, random: number): number {
  return Math.floor(random * (maximum - minimum + 1)) + minimum;
}

function randomBetween(minimum: number, maximum: number, random: number): number {
  return minimum + random * (maximum - minimum);
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function setRotation(element: HTMLElement, rotation: number) {
  element.style.transform = `rotate(${rotation}deg)`;
}

function secureRandom(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] / 2 ** 32;
}
