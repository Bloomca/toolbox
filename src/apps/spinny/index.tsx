import { createRef, createState, onUnmount } from "veles";

import { Button } from "../../design/button";
import {
  animatePointer,
  animateRotation,
  createInitialRotation,
  createSpinPlan,
  getPointerPosition,
  type RotationAnimation,
} from "./spin";
import { Wheel, type WheelChoice } from "./wheel";
import styles from "./style.module.css";

const CHOICES: readonly WheelChoice[] = [
  { id: "sun", label: "Sun", weight: 1 },
  { id: "water", label: "Water", weight: 1 },
  { id: "earth", label: "Earth", weight: 1 },
  { id: "wind", label: "Wind", weight: 1 },
  { id: "fire", label: "Fire", weight: 1 },
  { id: "sky", label: "Sky", weight: 1 },
  { id: "air", label: "Air", weight: 1 },
  { id: "ocean", label: "Ocean", weight: 1 },
  { id: "sand", label: "Sand", weight: 1 },
];

export function SpinnyApp() {
  const wheelRef = createRef<HTMLDivElement>();
  const pointerRef = createRef<HTMLDivElement>();
  const isSpinning$ = createState(false);
  const result$ = createState<WheelChoice | null>(null);
  const pointerPosition = getPointerPosition();
  let currentRotation = createInitialRotation(CHOICES);
  let rotationAnimation: RotationAnimation | undefined;
  let pointerAnimation: Animation | undefined;
  let mounted = true;

  onUnmount(() => {
    mounted = false;
    rotationAnimation?.cancel();
    pointerAnimation?.cancel();
  });

  async function spin() {
    if (isSpinning$.get() || !wheelRef.current) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plan = createSpinPlan(CHOICES, currentRotation, { reducedMotion });
    isSpinning$.set(true);
    result$.set(null);
    pointerAnimation?.cancel();

    rotationAnimation = animateRotation(wheelRef.current, plan);
    const completed = await rotationAnimation.finished;
    if (!completed || !mounted) return;

    currentRotation = plan.endRotation;
    rotationAnimation = undefined;
    if (!reducedMotion && pointerRef.current) {
      pointerAnimation = animatePointer(pointerRef.current);
    }
    result$.set(plan.choice);
    isSpinning$.set(false);
  }

  return (
    <div class={styles.app}>
      <div
        class={styles.wheelStage}
        aria-busy={isSpinning$.attribute((isSpinning) => (isSpinning ? "true" : "false"))}
      >
        <div
          ref={wheelRef}
          class={styles.wheelSpinner}
          style={{ transform: `rotate(${currentRotation}deg)` }}
        >
          <Wheel choices={CHOICES} />
        </div>
        <div
          class={styles.pointerPosition}
          aria-hidden="true"
          style={{
            left: `${pointerPosition.left}%`,
            top: `${pointerPosition.top}%`,
            transform: `translate(-50%, -50%) rotate(${pointerPosition.rotation}deg)`,
          }}
        >
          <div ref={pointerRef} class={styles.pointer} />
        </div>
      </div>

      <div class={styles.controls}>
        <Button disabled={isSpinning$.attribute()} onClick={spin}>
          {isSpinning$.render((isSpinning) => (isSpinning ? "Spinning…" : "Spin"))}
        </Button>
      </div>

      <div class={styles.result} role="status" aria-live="polite">
        {result$.render((result) => (result ? `Winner: ${result.label}` : null))}
      </div>
    </div>
  );
}
