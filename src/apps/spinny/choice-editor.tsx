import { createRef, createState, onMount, type State } from "veles";

import { Button } from "../../design/button";
import { Checkbox } from "../../design/checkbox";
import { Dropdown } from "../../design/dropdown";
import { Slider } from "../../design/slider";
import { TextInput } from "../../design/text-input";
import { Tooltip } from "../../design/tooltip";
import type { EditableChoice, SavedSpinnyList } from "./types";
import { MAX_CHOICES } from "./wheel";
import styles from "./style.module.css";

const MINIMUM_WEIGHT_SLIDER_VALUE = 1;
const MAXIMUM_WEIGHT_SLIDER_VALUE = 9;
const MINIMUM_CHOICE_WEIGHT = 0.5;
const DEFAULT_CHOICE_WEIGHT = 1;
const CHOICE_WEIGHT_STEP = 0.125;
const CHOICE_NESTING_INDENT_PIXELS = 24;

let nextChoiceOptionsId = 1;

type ChoiceUpdate = Partial<Pick<EditableChoice, "included" | "label" | "weight">>;

type ChoiceEditorProps = {
  title$: State<string>;
  choices$: State<EditableChoice[]>;
  savedLists$: State<SavedSpinnyList[]>;
  selectedListId$: State<string | null>;
  listsLoaded$: State<boolean>;
  disabled$: State<boolean>;
  saveDisabled$: State<boolean>;
  shared$: State<boolean>;
  onCreateNewList: () => void;
  onDeleteList: () => void;
  onEdit: () => void;
  onSave: () => void;
  onSelectList: (id: string) => void;
  onShare: () => void;
  onUpdate: () => void;
};

export function ChoiceEditor({
  title$,
  choices$,
  savedLists$,
  selectedListId$,
  listsLoaded$,
  disabled$,
  saveDisabled$,
  shared$,
  onCreateNewList,
  onDeleteList,
  onEdit,
  onSave,
  onSelectList,
  onShare,
  onUpdate,
}: ChoiceEditorProps) {
  const updateDisabled$ = disabled$
    .combine(shared$)
    .map(([editorDisabled, shared]) => editorDisabled || shared);
  const shareDisabled$ = saveDisabled$
    .combine(shared$, disabled$)
    .map(([saveDisabled, shared, editorDisabled]) => (shared ? editorDisabled : saveDisabled));
  const canAddTopLevelChoice$ = choices$.map(
    (choices) => countChoicesForParent(choices, null) < MAX_CHOICES,
  );
  const savedListOptions$ = savedLists$.combine(listsLoaded$, disabled$, selectedListId$);
  const newListDisabled$ = selectedListId$
    .combine(disabled$)
    .map(([selectedListId, editorDisabled]) => !selectedListId || editorDisabled);
  const addTopLevelChoiceDisabled$ = disabled$
    .combine(canAddTopLevelChoice$)
    .map(([editorDisabled, canAdd]) => editorDisabled || !canAdd);
  let nextChoiceId = 1;
  let choiceIdToFocus: string | null = null;

  function updateChoice(id: string, update: ChoiceUpdate) {
    choices$.update((choices) =>
      choices.map((choice) => (choice.id === id ? { ...choice, ...update } : choice)),
    );
    onEdit();
  }

  function addChoice(parentChoiceId: string | null) {
    const choices = choices$.get();
    if (disabled$.get() || countChoicesForParent(choices, parentChoiceId) >= MAX_CHOICES) {
      return;
    }

    let id: string;
    do {
      id = `custom-${nextChoiceId++}`;
    } while (choices.some((choice) => choice.id === id));

    const choice: EditableChoice = {
      id,
      label: "",
      weight: DEFAULT_CHOICE_WEIGHT,
      included: true,
      parentChoiceId,
    };
    const insertionIndex = getChoiceInsertionIndex(choices, parentChoiceId);
    const nextChoices = choices.slice();
    nextChoices.splice(insertionIndex, 0, choice);
    choiceIdToFocus = id;
    choices$.set(nextChoices);
    onEdit();
  }

  function deleteChoice(id: string) {
    if (disabled$.get()) return;

    choices$.update((choices) => {
      const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
      return choices.filter(
        (choice) => choice.id !== id && !isDescendantOf(choice, id, choicesById),
      );
    });
    onEdit();
  }

  return (
    <aside
      class={styles.choiceEditor}
      aria-label={title$.attribute((title) => `${title.trim() || "Untitled list"} editor`)}
    >
      <div class={styles.savedListsField}>
        {savedListOptions$.render(([savedLists, listsLoaded, editorDisabled, selectedListId]) => (
          <Dropdown
            aria-label="Saved lists"
            disabled={editorDisabled || !listsLoaded || savedLists.length === 0}
            value={selectedListId ?? ""}
            onChange={(event) => onSelectList(event.target.value)}
            placeholder="New list (unsaved)"
            placeholderSelected={selectedListId === null}
            options={savedLists.map((list) => ({
              value: list.id,
              label: list.shared ? `🌐 ${list.title}` : list.title,
            }))}
          />
        ))}
        <Button disabled={newListDisabled$.attribute()} onClick={onCreateNewList}>
          New
        </Button>
      </div>
      <label class={styles.listTitleField}>
        <TextInput
          aria-label="List title"
          disabled={disabled$.attribute()}
          value={title$.attribute()}
          onInput={(event) => {
            title$.set(event.target.value);
            onEdit();
          }}
        />
      </label>
      <div class={styles.listSaveAction}>
        {selectedListId$.render((selectedListId) =>
          selectedListId ? (
            <>
              <Tooltip
                content="Cannot update shared lists. Save as new to edit"
                hidden={shared$.attribute((shared) => !shared)}
              >
                <Button disabled={updateDisabled$.attribute()} onClick={onUpdate}>
                  Update
                </Button>
              </Tooltip>
              <Button disabled={saveDisabled$.attribute()} onClick={onSave}>
                Save as new
              </Button>
              <Button disabled={shareDisabled$.attribute()} onClick={onShare}>
                Share
              </Button>
              <Button tone="danger" disabled={disabled$.attribute()} onClick={onDeleteList}>
                Delete
              </Button>
            </>
          ) : (
            <Button disabled={saveDisabled$.attribute()} onClick={onSave}>
              Save
            </Button>
          ),
        )}
      </div>
      <h2 class={styles.choiceEditorTitle}>Choices</h2>
      <ul class={styles.choiceList}>
        {choices$.renderEach({ key: "id" }, ({ elementState: choice$ }) => (
          <ChoiceRow
            choice$={choice$}
            choices$={choices$}
            disabled$={disabled$}
            focusOnMount={choiceIdToFocus === choice$.get().id}
            onAddChoice={addChoice}
            onChange={updateChoice}
            onDelete={deleteChoice}
            onFocusHandled={() => {
              choiceIdToFocus = null;
            }}
          />
        ))}
      </ul>
      <div class={styles.choiceActions}>
        <Button disabled={addTopLevelChoiceDisabled$.attribute()} onClick={() => addChoice(null)}>
          Add option
        </Button>
      </div>
    </aside>
  );
}

function ChoiceRow({
  choice$,
  choices$,
  disabled$,
  focusOnMount,
  onAddChoice,
  onChange,
  onDelete,
  onFocusHandled,
}: {
  choice$: State<EditableChoice>;
  choices$: State<EditableChoice[]>;
  disabled$: State<boolean>;
  focusOnMount: boolean;
  onAddChoice: (parentChoiceId: string | null) => void;
  onChange: (id: string, update: ChoiceUpdate) => void;
  onDelete: (id: string) => void;
  onFocusHandled: () => void;
}) {
  const inputRef = createRef<HTMLInputElement>();
  const optionsExpanded$ = createState(choice$.get().weight !== DEFAULT_CHOICE_WEIGHT);
  const optionsButtonTone$ = choice$
    .combine(optionsExpanded$)
    .map(([choice, optionsExpanded]) =>
      !optionsExpanded && choice.weight !== DEFAULT_CHOICE_WEIGHT ? "modified" : "default",
    );
  const optionsId = `spinny-choice-options-${nextChoiceOptionsId++}`;
  const choiceIndent$ = choice$
    .combine(choices$)
    .map(
      ([choice, choices]) =>
        `${getChoiceNestingLevel(choice, choices) * CHOICE_NESTING_INDENT_PIXELS}px`,
    );
  const isValid$ = choice$.map(isChoiceValid);
  const isChecked$ = choice$.map((choice) => choice.included && isChoiceValid(choice));
  const checkboxDisabled$ = disabled$.combine(isValid$);
  const canAddNestedChoice$ = choices$.map(
    (choices) => countChoicesForParent(choices, choice$.get().id) < MAX_CHOICES,
  );
  const addNestedChoiceDisabled$ = disabled$
    .combine(canAddNestedChoice$)
    .map(([editorDisabled, canAdd]) => editorDisabled || !canAdd);

  choice$.trackSelected(
    (choice) => choice.weight,
    (weight) => {
      if (weight !== DEFAULT_CHOICE_WEIGHT) optionsExpanded$.set(true);
    },
    { skipFirstCall: true },
  );

  onMount(() => {
    if (!focusOnMount || !inputRef.current) return;
    inputRef.current.focus();
    onFocusHandled();
  });

  return (
    <li
      class={styles.choiceRow}
      style={choiceIndent$.attribute((choiceIndent) => ({ "--choice-indent": choiceIndent }))}
      data-invalid={isValid$.attribute((isValid) => !isValid)}
      data-parent-choice-id={choice$.attribute((choice) => choice.parentChoiceId ?? undefined)}
    >
      <Tooltip content="Toggle this option" placement="top">
        <Checkbox
          aria-label={choice$.attribute((choice) => `Include ${choice.label || "blank choice"}`)}
          checked={isChecked$.attribute()}
          disabled={checkboxDisabled$.attribute(
            ([editorDisabled, isValid]) => editorDisabled || !isValid,
          )}
          onChange={(event) => onChange(choice$.get().id, { included: event.target.checked })}
        />
      </Tooltip>
      <TextInput
        ref={inputRef}
        aria-label="Choice name"
        aria-invalid={isValid$.attribute((isValid) => (isValid ? "false" : "true"))}
        disabled={disabled$.attribute()}
        value={choice$.attribute((choice) => choice.label)}
        onInput={(event) => onChange(choice$.get().id, { label: event.target.value })}
        onKeyDown={(event) => {
          if (
            event.key !== "Enter" ||
            event.repeat ||
            event.isComposing ||
            !isChoiceValid(choice$.get())
          ) {
            return;
          }
          event.preventDefault();
          onAddChoice(choice$.get().parentChoiceId);
        }}
      />
      <Tooltip content="Options" placement="top">
        <Button
          variant="icon"
          tone={optionsButtonTone$.attribute()}
          aria-label={choice$.attribute(
            (choice) => `Options for ${choice.label || "blank choice"}`,
          )}
          aria-controls={optionsId}
          aria-expanded={optionsExpanded$.attribute((expanded) => (expanded ? "true" : "false"))}
          aria-pressed={optionsExpanded$.attribute((expanded) => (expanded ? "true" : "false"))}
          disabled={disabled$.attribute()}
          onClick={() => optionsExpanded$.update((expanded) => !expanded)}
        >
          <span aria-hidden="true">…</span>
        </Button>
      </Tooltip>
      <Tooltip content="Delete" placement="top">
        <Button
          variant="icon"
          tone="danger"
          aria-label={choice$.attribute((choice) => `Delete ${choice.label || "blank choice"}`)}
          disabled={disabled$.attribute()}
          onClick={() => onDelete(choice$.get().id)}
        >
          <span aria-hidden="true">−</span>
        </Button>
      </Tooltip>
      {optionsExpanded$.render((expanded) =>
        expanded ? (
          <div id={optionsId} class={styles.choiceOptions}>
            <Slider
              aria-label={choice$.attribute(
                (choice) => `Weight for ${choice.label || "blank choice"}`,
              )}
              min={MINIMUM_WEIGHT_SLIDER_VALUE}
              max={MAXIMUM_WEIGHT_SLIDER_VALUE}
              step={1}
              value={choice$.attribute((choice) => choiceWeightToSliderValue(choice.weight))}
              aria-valuetext={choice$.attribute((choice) => `${formatWeight(choice.weight)}×`)}
              disabled={disabled$.attribute()}
              onInput={(event) =>
                onChange(choice$.get().id, {
                  weight: sliderValueToChoiceWeight(Number(event.target.value)),
                })
              }
            />
            <Tooltip content="Add sub-choice" placement="top">
              <Button
                variant="icon"
                aria-label={choice$.attribute(
                  (choice) => `Add sub-choice to ${choice.label || "blank choice"}`,
                )}
                disabled={addNestedChoiceDisabled$.attribute()}
                onClick={() => onAddChoice(choice$.get().id)}
              >
                <span aria-hidden="true">+</span>
              </Button>
            </Tooltip>
          </div>
        ) : null,
      )}
    </li>
  );
}

function countChoicesForParent(
  choices: readonly EditableChoice[],
  parentChoiceId: string | null,
): number {
  return choices.filter((choice) => choice.parentChoiceId === parentChoiceId).length;
}

function getChoiceNestingLevel(choice: EditableChoice, choices: readonly EditableChoice[]): number {
  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  const visitedChoiceIds = new Set<string>();
  let nestingLevel = 0;
  let parentChoiceId = choice.parentChoiceId;

  while (parentChoiceId && !visitedChoiceIds.has(parentChoiceId)) {
    visitedChoiceIds.add(parentChoiceId);
    const parentChoice = choicesById.get(parentChoiceId);
    if (!parentChoice) break;
    nestingLevel += 1;
    parentChoiceId = parentChoice.parentChoiceId;
  }

  return nestingLevel;
}

function getChoiceInsertionIndex(
  choices: readonly EditableChoice[],
  parentChoiceId: string | null,
): number {
  if (parentChoiceId === null) return choices.length;

  const parentIndex = choices.findIndex((choice) => choice.id === parentChoiceId);
  if (parentIndex === -1) return choices.length;

  const choicesById = new Map(choices.map((choice) => [choice.id, choice]));
  let insertionIndex = parentIndex + 1;
  while (
    insertionIndex < choices.length &&
    isDescendantOf(choices[insertionIndex], parentChoiceId, choicesById)
  ) {
    insertionIndex += 1;
  }
  return insertionIndex;
}

function isDescendantOf(
  choice: EditableChoice,
  ancestorChoiceId: string,
  choicesById: ReadonlyMap<string, EditableChoice>,
): boolean {
  const visitedChoiceIds = new Set<string>();
  let parentChoiceId = choice.parentChoiceId;

  while (parentChoiceId && !visitedChoiceIds.has(parentChoiceId)) {
    if (parentChoiceId === ancestorChoiceId) return true;
    visitedChoiceIds.add(parentChoiceId);
    parentChoiceId = choicesById.get(parentChoiceId)?.parentChoiceId ?? null;
  }
  return false;
}

function sliderValueToChoiceWeight(value: number): number {
  const sliderValue = Math.min(
    MAXIMUM_WEIGHT_SLIDER_VALUE,
    Math.max(MINIMUM_WEIGHT_SLIDER_VALUE, Math.round(value)),
  );
  return MINIMUM_CHOICE_WEIGHT + (sliderValue - MINIMUM_WEIGHT_SLIDER_VALUE) * CHOICE_WEIGHT_STEP;
}

function choiceWeightToSliderValue(weight: number): number {
  return Math.min(
    MAXIMUM_WEIGHT_SLIDER_VALUE,
    Math.max(
      MINIMUM_WEIGHT_SLIDER_VALUE,
      Math.round((weight - MINIMUM_CHOICE_WEIGHT) / CHOICE_WEIGHT_STEP) +
        MINIMUM_WEIGHT_SLIDER_VALUE,
    ),
  );
}

function formatWeight(weight: number): string {
  return weight.toFixed(3).replace(/\.?0+$/, "");
}

export function isChoiceValid(choice: Pick<EditableChoice, "label">): boolean {
  return choice.label.trim().length > 0;
}
