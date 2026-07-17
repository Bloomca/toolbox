import { createRef, onUnmount, type State } from "veles";

import { Button } from "../../design/button";
import { isChoiceValid } from "./choice-editor";
import {
  animatePointer,
  animateRotation,
  createInitialRotation,
  createSpinPlan,
  getPointerPosition,
  type RotationAnimation,
} from "./spin";
import { appendSpinHistory } from "./storage";
import styles from "./style.module.css";
import type { EditableChoice } from "./types";
import { Wheel, type WheelChoice } from "./wheel";

const MINIMUM_SPIN_CHOICES = 2;

type SpinnerPanelProps = {
  choices$: State<EditableChoice[]>;
  isSpinning$: State<boolean>;
  result$: State<WheelChoice | null>;
};

export function SpinnerPanel({ choices$, isSpinning$, result$ }: SpinnerPanelProps) {
  const wheelRef = createRef<HTMLDivElement>();
  const pointerRef = createRef<HTMLDivElement>();
  const activeChoices$ = choices$.map(getActiveChoices);
  const canSpin$ = activeChoices$.map((choices) => choices.length >= MINIMUM_SPIN_CHOICES);
  const spinDisabled$ = isSpinning$.combine(canSpin$);
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

  return (
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
          result ? `Winner: ${result.label}` : canSpin ? null : "Enable at least two named choices",
        )}
      </div>
    </section>
  );
}

function getActiveChoices(choices: readonly EditableChoice[]): WheelChoice[] {
  return choices
    .filter((choice) => choice.parentChoiceId === null && choice.included && isChoiceValid(choice))
    .map(({ included: _included, parentChoiceId: _parentChoiceId, ...choice }) => ({
      ...choice,
      label: choice.label.trim(),
    }));
}
