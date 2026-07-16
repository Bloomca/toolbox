import type { State } from "veles";

import { Button } from "../../design/button";
import { Checkbox } from "../../design/checkbox";
import { TextInput } from "../../design/text-input";
import { MAX_CHOICES, type WheelChoice } from "./wheel";
import styles from "./style.module.css";

export type EditableChoice = WheelChoice & {
  included: boolean;
};

type ChoiceEditorProps = {
  title$: State<string>;
  choices$: State<EditableChoice[]>;
  disabled$: State<boolean>;
  onEdit: () => void;
};

export function ChoiceEditor({ title$, choices$, disabled$, onEdit }: ChoiceEditorProps) {
  const canAdd$ = choices$.map((choices) => choices.length < MAX_CHOICES);
  const addDisabled$ = disabled$.combine(canAdd$);
  let nextChoiceId = 1;

  function updateChoice(id: string, update: Partial<Pick<EditableChoice, "included" | "label">>) {
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
      <label class={styles.listTitleField}>
        <span class={styles.listTitleLabel}>List title</span>
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
      <h2 class={styles.choiceEditorTitle}>Choices</h2>
      <ul class={styles.choiceList}>
        {choices$.renderEach({ key: "id" }, ({ elementState: choice$ }) => (
          <ChoiceRow
            choice$={choice$}
            disabled$={disabled$}
            onChange={updateChoice}
            onDelete={deleteChoice}
          />
        ))}
      </ul>
      <div class={styles.choiceActions}>
        <Button
          disabled={addDisabled$.attribute(([editorDisabled, canAdd]) => editorDisabled || !canAdd)}
          onClick={addChoice}
        >
          Add
        </Button>
      </div>
    </aside>
  );
}

function ChoiceRow({
  choice$,
  disabled$,
  onChange,
  onDelete,
}: {
  choice$: State<EditableChoice>;
  disabled$: State<boolean>;
  onChange: (id: string, update: Partial<Pick<EditableChoice, "included" | "label">>) => void;
  onDelete: (id: string) => void;
}) {
  const isValid$ = choice$.map(isChoiceValid);
  const isChecked$ = choice$.map((choice) => choice.included && isChoiceValid(choice));
  const checkboxDisabled$ = disabled$.combine(isValid$);

  return (
    <li class={styles.choiceRow} data-invalid={isValid$.attribute((isValid) => !isValid)}>
      <Checkbox
        aria-label={choice$.attribute((choice) => `Include ${choice.label || "blank choice"}`)}
        checked={isChecked$.attribute()}
        disabled={checkboxDisabled$.attribute(
          ([editorDisabled, isValid]) => editorDisabled || !isValid,
        )}
        onChange={(event) => onChange(choice$.get().id, { included: event.target.checked })}
      />
      <TextInput
        aria-label="Choice name"
        aria-invalid={isValid$.attribute((isValid) => (isValid ? "false" : "true"))}
        disabled={disabled$.attribute()}
        value={choice$.attribute((choice) => choice.label)}
        onInput={(event) => onChange(choice$.get().id, { label: event.target.value })}
      />
      <Button
        variant="icon"
        tone="danger"
        aria-label={choice$.attribute((choice) => `Delete ${choice.label || "blank choice"}`)}
        disabled={disabled$.attribute()}
        onClick={() => onDelete(choice$.get().id)}
      >
        <span aria-hidden="true">−</span>
      </Button>
    </li>
  );
}

export function isChoiceValid(choice: Pick<EditableChoice, "label">): boolean {
  return choice.label.trim().length > 0;
}
