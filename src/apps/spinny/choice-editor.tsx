import type { State } from "veles";

import { Checkbox } from "../../design/checkbox";
import { TextInput } from "../../design/text-input";
import type { WheelChoice } from "./wheel";
import styles from "./style.module.css";

export type EditableChoice = WheelChoice & {
  included: boolean;
};

type ChoiceEditorProps = {
  choices$: State<EditableChoice[]>;
  disabled$: State<boolean>;
  onEdit: () => void;
};

export function ChoiceEditor({ choices$, disabled$, onEdit }: ChoiceEditorProps) {
  function updateChoice(id: string, update: Partial<Pick<EditableChoice, "included" | "label">>) {
    choices$.update((choices) =>
      choices.map((choice) => (choice.id === id ? { ...choice, ...update } : choice)),
    );
    onEdit();
  }

  return (
    <aside class={styles.choiceEditor} aria-label="Wheel choices editor">
      <h2 class={styles.choiceEditorTitle}>Choices</h2>
      <ul class={styles.choiceList}>
        {choices$.renderEach({ key: "id" }, ({ elementState: choice$ }) => (
          <ChoiceRow choice$={choice$} disabled$={disabled$} onChange={updateChoice} />
        ))}
      </ul>
    </aside>
  );
}

function ChoiceRow({
  choice$,
  disabled$,
  onChange,
}: {
  choice$: State<EditableChoice>;
  disabled$: State<boolean>;
  onChange: (id: string, update: Partial<Pick<EditableChoice, "included" | "label">>) => void;
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
    </li>
  );
}

export function isChoiceValid(choice: Pick<EditableChoice, "label">): boolean {
  return choice.label.trim().length > 0;
}
