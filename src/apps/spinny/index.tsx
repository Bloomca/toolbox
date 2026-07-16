import { createRef, createState, onUnmount } from "veles";

import { Button } from "../../design/button";
import { ChoiceEditor, isChoiceValid, type EditableChoice } from "./choice-editor";
import { appendSpinHistory } from "./storage";
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

const MINIMUM_SPIN_CHOICES = 2;

const INITIAL_CHOICES: readonly EditableChoice[] = [
  { id: "sun", label: "Sun", weight: 1, included: true },
  { id: "water", label: "Water", weight: 1, included: true },
  { id: "earth", label: "Earth", weight: 1, included: true },
  { id: "wind", label: "Wind", weight: 1, included: true },
  { id: "fire", label: "Fire", weight: 1, included: true },
  { id: "sky", label: "Sky", weight: 1, included: true },
  { id: "air", label: "Air", weight: 1, included: true },
  { id: "ocean", label: "Ocean", weight: 1, included: true },
  { id: "sand", label: "Sand", weight: 1, included: true },
];

export function SpinnyApp() {
  const wheelRef = createRef<HTMLDivElement>();
  const pointerRef = createRef<HTMLDivElement>();
  const choices$ = createState<EditableChoice[]>(INITIAL_CHOICES.map((choice) => ({ ...choice })));
  const activeChoices$ = choices$.map(getActiveChoices);
  const canSpin$ = activeChoices$.map((choices) => choices.length >= MINIMUM_SPIN_CHOICES);
  const isSpinning$ = createState(false);
  const spinDisabled$ = isSpinning$.combine(canSpin$);
  const result$ = createState<WheelChoice | null>(null);
  const selectedChoiceId$ = result$.map((result) => result?.id ?? null);
  const resultMessage$ = result$.combine(canSpin$);
  const pointerPosition = getPointerPosition();
  let currentRotation = createInitialRotation(activeChoices$.get());
  let rotationAnimation: RotationAnimation | undefined;
  let pointerAnimation: Animation | undefined;
  let mounted = true;

  onUnmount(() => {
    mounted = false;
    rotationAnimation?.cancel();
    pointerAnimation?.cancel();
  });

  async function spin() {
    const activeChoices = activeChoices$.get();
    if (isSpinning$.get() || activeChoices.length < MINIMUM_SPIN_CHOICES || !wheelRef.current) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plan = createSpinPlan(activeChoices, currentRotation, { reducedMotion });
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
    void appendSpinHistory({
      winner: { id: plan.choice.id, label: plan.choice.label },
      timestamp: Date.now(),
    }).catch((error) => console.error("Could not save Spinny history.", error));
  }

  function clearResult() {
    result$.set(null);
  }

  return (
    <div class={styles.app}>
      <section class={styles.spinnerPanel} aria-label="Spinner">
        <div
          class={styles.wheelStage}
          aria-busy={isSpinning$.attribute((isSpinning) => (isSpinning ? "true" : "false"))}
        >
          <div
            ref={wheelRef}
            class={styles.wheelSpinner}
            style={{ transform: `rotate(${currentRotation}deg)` }}
          >
            {activeChoices$.render((choices) => (
              <Wheel choices={choices} selectedChoiceId$={selectedChoiceId$} />
            ))}
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
          <Button
            disabled={spinDisabled$.attribute(([isSpinning, canSpin]) => isSpinning || !canSpin)}
            onClick={spin}
          >
            {isSpinning$.render((isSpinning) => (isSpinning ? "Spinning…" : "Spin"))}
          </Button>
        </div>

        <div class={styles.result} role="status" aria-live="polite">
          {resultMessage$.render(([result, canSpin]) =>
            result
              ? `Winner: ${result.label}`
              : canSpin
                ? null
                : "Enable at least two named choices",
          )}
        </div>
      </section>

      <ChoiceEditor choices$={choices$} disabled$={isSpinning$} onEdit={clearResult} />
    </div>
  );
}

function getActiveChoices(choices: readonly EditableChoice[]): WheelChoice[] {
  return choices
    .filter((choice) => choice.included && isChoiceValid(choice))
    .map(({ included: _included, ...choice }) => ({ ...choice, label: choice.label.trim() }));
}
