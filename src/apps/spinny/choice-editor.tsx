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
  onCreateNewList: () => void;
  onDeleteList: () => void;
  onEdit: () => void;
  onSave: () => void;
  onSelectList: (id: string) => void;
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
  onCreateNewList,
  onDeleteList,
  onEdit,
  onSave,
  onSelectList,
  onUpdate,
}: ChoiceEditorProps) {
  const canAdd$ = choices$.map((choices) => choices.length < MAX_CHOICES);
  const savedListOptions$ = savedLists$.combine(listsLoaded$, disabled$, selectedListId$);
  const newListDisabled$ = selectedListId$
    .combine(disabled$)
    .map(([selectedListId, editorDisabled]) => !selectedListId || editorDisabled);
  const addDisabled$ = disabled$.combine(canAdd$);
  let nextChoiceId = 1;
  let choiceIdToFocus: string | null = null;

  function updateChoice(id: string, update: ChoiceUpdate) {
    choices$.update((choices) =>
      choices.map((choice) => (choice.id === id ? { ...choice, ...update } : choice)),
    );
    onEdit();
  }

  function addChoice() {
    if (disabled$.get() || choices$.get().length >= MAX_CHOICES) return;

    const choices = choices$.get();
    let id: string;
    do {
      id = `custom-${nextChoiceId++}`;
    } while (choices.some((choice) => choice.id === id));

    choiceIdToFocus = id;
    choices$.set(choices.concat({ id, label: "", weight: 1, included: true }));
    onEdit();
  }

  function deleteChoice(id: string) {
    if (disabled$.get()) return;
    choices$.update((choices) => choices.filter((choice) => choice.id !== id));
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
            options={savedLists.map((list) => ({ value: list.id, label: list.title }))}
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
              <Button disabled={disabled$.attribute()} onClick={onUpdate}>
                Update
              </Button>
              <Button disabled={saveDisabled$.attribute()} onClick={onSave}>
                Save as new
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
        <Button
          disabled={addDisabled$.attribute(([editorDisabled, canAdd]) => editorDisabled || !canAdd)}
          onClick={addChoice}
        >
          Add option
        </Button>
      </div>
    </aside>
  );
}

function ChoiceRow({
  choice$,
  disabled$,
  focusOnMount,
  onAddChoice,
  onChange,
  onDelete,
  onFocusHandled,
}: {
  choice$: State<EditableChoice>;
  disabled$: State<boolean>;
  focusOnMount: boolean;
  onAddChoice: () => void;
  onChange: (id: string, update: ChoiceUpdate) => void;
  onDelete: (id: string) => void;
  onFocusHandled: () => void;
}) {
  const inputRef = createRef<HTMLInputElement>();
  const optionsExpanded$ = createState(choice$.get().weight !== DEFAULT_CHOICE_WEIGHT);
  const optionsId = `spinny-choice-options-${nextChoiceOptionsId++}`;
  const isValid$ = choice$.map(isChoiceValid);
  const isChecked$ = choice$.map((choice) => choice.included && isChoiceValid(choice));
  const checkboxDisabled$ = disabled$.combine(isValid$);

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
    <li class={styles.choiceRow} data-invalid={isValid$.attribute((isValid) => !isValid)}>
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
          onAddChoice();
        }}
      />
      <Tooltip content="Options" placement="top">
        <Button
          variant="icon"
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
          </div>
        ) : null,
      )}
    </li>
  );
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
