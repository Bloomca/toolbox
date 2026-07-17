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
  listTitle$: State<string>;
  choices$: State<EditableChoice[]>;
  selectedCategoryPath$: State<string[]>;
  isSpinning$: State<boolean>;
  result$: State<WheelChoice | null>;
};

export function SpinnerPanel({
  listTitle$,
  choices$,
  selectedCategoryPath$,
  isSpinning$,
  result$,
}: SpinnerPanelProps) {
  const wheelRef = createRef<HTMLDivElement>();
  const pointerRef = createRef<HTMLDivElement>();
  const wheelLevel$ = choices$
    .combine(selectedCategoryPath$)
    .map(([choices, categoryPath]) => createWheelLevel(choices, categoryPath));
  const canSpin$ = wheelLevel$.map(
    (wheelLevel) => wheelLevel.choices.length >= MINIMUM_SPIN_CHOICES,
  );
  const spinDisabled$ = isSpinning$.combine(canSpin$);
  const selectedChoiceId$ = result$.map((result) => result?.id ?? null);
  const resultMessage$ = result$.combine(canSpin$);
  const spinWithinChoice$ = result$
    .combine(choices$)
    .map(([result, choices]) =>
      result && getActiveChoices(choices, result.id).length >= MINIMUM_SPIN_CHOICES ? result : null,
    );
  const breadcrumbs$ = listTitle$
    .combine(selectedCategoryPath$, choices$)
    .map(([listTitle, categoryPath, choices]) =>
      createBreadcrumbs(listTitle, categoryPath, choices),
    );
  const pointerPosition = getPointerPosition();
  let currentRotation = createRotation(wheelLevel$.get().choices);
  let rotationAnimation: RotationAnimation | undefined;
  let pointerAnimation: Animation | undefined;
  let mounted = true;

  selectedCategoryPath$.track(
    (categoryPath) => {
      const activeChoices = getActiveChoices(choices$.get(), categoryPath.at(-1) ?? null);
      currentRotation = createRotation(activeChoices);
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
      }
      pointerAnimation?.cancel();
      result$.set(null);
    },
    { skipFirstCall: true },
  );

  choices$.track(
    (choices) => {
      const categoryPath = selectedCategoryPath$.get();
      const validCategoryPath = getValidCategoryPath(categoryPath, choices);
      if (validCategoryPath.length !== categoryPath.length) {
        selectedCategoryPath$.set(validCategoryPath);
      }
    },
    { skipFirstCall: true },
  );

  onUnmount(() => {
    mounted = false;
    rotationAnimation?.cancel();
    pointerAnimation?.cancel();
  });

  function selectCategory(choiceId: string): boolean {
    if (isSpinning$.get()) return false;

    const choices = choices$.get();
    const categoryPath = selectedCategoryPath$.get();
    const currentChoices = getActiveChoices(choices, categoryPath.at(-1) ?? null);
    const categoryChoices = getActiveChoices(choices, choiceId);
    if (
      !currentChoices.some((choice) => choice.id === choiceId) ||
      categoryChoices.length < MINIMUM_SPIN_CHOICES
    ) {
      return false;
    }

    selectedCategoryPath$.set([...categoryPath, choiceId]);
    return true;
  }

  async function spinWithinCategory(choiceId: string) {
    if (!selectCategory(choiceId)) return;
    await Promise.resolve();
    if (mounted) await spin();
  }

  function selectBreadcrumb(index: number) {
    if (isSpinning$.get()) return;
    selectedCategoryPath$.set(selectedCategoryPath$.get().slice(0, index));
  }

  async function spin() {
    const activeChoices = wheelLevel$.get().choices;
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
      <nav class={styles.wheelBreadcrumbs} aria-label="Wheel location">
        {breadcrumbs$.render((breadcrumbs) => (
          <ol>
            {breadcrumbs.map((breadcrumb, index) => (
              <li>
                {index > 0 ? (
                  <span class={styles.wheelBreadcrumbSeparator} aria-hidden="true">
                    {">"}
                  </span>
                ) : null}
                {index < breadcrumbs.length - 1 ? (
                  <button
                    type="button"
                    aria-label={`Show ${breadcrumb} choices`}
                    disabled={isSpinning$.attribute()}
                    onClick={() => selectBreadcrumb(index)}
                  >
                    {breadcrumb}
                  </button>
                ) : (
                  <span aria-current="page">{breadcrumb}</span>
                )}
              </li>
            ))}
          </ol>
        ))}
      </nav>
      <div
        class={styles.wheelStage}
        aria-busy={isSpinning$.attribute((isSpinning) => (isSpinning ? "true" : "false"))}
      >
        <div
          ref={wheelRef}
          class={styles.wheelSpinner}
          style={{ transform: `rotate(${currentRotation}deg)` }}
        >
          {wheelLevel$.render(({ choices, selectableChoiceIds }) => (
            <Wheel
              choices={choices}
              selectedChoiceId$={selectedChoiceId$}
              selectableChoiceIds={selectableChoiceIds}
              onChoiceSelect={selectCategory}
            />
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
        {spinWithinChoice$.render((choice) =>
          choice ? (
            <Button
              class={styles.spinWithinButton}
              onClick={() => void spinWithinCategory(choice.id)}
            >
              Spin within {choice.label}
            </Button>
          ) : null,
        )}
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

type WheelLevel = {
  choices: WheelChoice[];
  selectableChoiceIds: ReadonlySet<string>;
};

function createWheelLevel(
  choices: readonly EditableChoice[],
  categoryPath: readonly string[],
): WheelLevel {
  const activeChoices = getActiveChoices(choices, categoryPath.at(-1) ?? null);
  const selectableChoiceIds = new Set(
    activeChoices
      .filter((choice) => getActiveChoices(choices, choice.id).length >= MINIMUM_SPIN_CHOICES)
      .map((choice) => choice.id),
  );
  return { choices: activeChoices, selectableChoiceIds };
}

function getActiveChoices(
  choices: readonly EditableChoice[],
  parentChoiceId: string | null,
): WheelChoice[] {
  return choices
    .filter(
      (choice) =>
        choice.parentChoiceId === parentChoiceId && choice.included && isChoiceValid(choice),
    )
    .map(({ included: _included, parentChoiceId: _parentChoiceId, ...choice }) => ({
      ...choice,
      label: choice.label.trim(),
    }));
}

function createBreadcrumbs(
  listTitle: string,
  categoryPath: readonly string[],
  choices: readonly EditableChoice[],
): string[] {
  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  return [
    listTitle.trim() || "Untitled list",
    ...categoryPath.map(
      (choiceId) => choicesById.get(choiceId)?.label.trim() || "Unknown subcategory",
    ),
  ];
}

function getValidCategoryPath(
  categoryPath: readonly string[],
  choices: readonly EditableChoice[],
): string[] {
  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  const validCategoryPath: string[] = [];
  let parentChoiceId: string | null = null;

  for (const choiceId of categoryPath) {
    const choice = choicesById.get(choiceId);
    if (!choice || choice.parentChoiceId !== parentChoiceId) break;
    validCategoryPath.push(choiceId);
    parentChoiceId = choiceId;
  }

  return validCategoryPath;
}

function createRotation(choices: readonly WheelChoice[]): number {
  return choices.length > 0 ? createInitialRotation(choices) : 0;
}
