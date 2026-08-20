import { createState, onMount } from "veles";

import { Button } from "../../design/button";
import { Modal } from "../../design/modal";
import { TextInput } from "../../design/text-input";
import styles from "./import-list-modal.module.css";

export function ImportListModal({
  initialValue = "",
  autoImport = false,
  onImport,
  onClose,
}: {
  initialValue?: string;
  autoImport?: boolean;
  onImport: (value: string) => Promise<void>;
  onClose: () => void;
}) {
  const value$ = createState(initialValue);
  const isImporting$ = createState(false);
  const error$ = createState<string | null>(null);
  const importDisabled$ = value$
    .combine(isImporting$)
    .map(([value, isImporting]) => isImporting || !value.trim());

  onMount(() => {
    if (autoImport) void importList();
  });

  function close() {
    if (!isImporting$.get()) onClose();
  }

  async function importList() {
    const value = value$.get().trim();
    if (!value || isImporting$.get()) return;

    isImporting$.set(true);
    error$.set(null);
    let imported = false;
    try {
      await onImport(value);
      imported = true;
    } catch (error) {
      error$.set(error instanceof Error ? error.message : "Could not import shared list.");
    } finally {
      isImporting$.set(false);
    }

    if (imported) onClose();
  }

  return (
    <Modal title="Import list" onClose={close}>
      <div class={styles.field}>
        <TextInput
          aria-label="Shared list link"
          data-toolbox-modal-initial-focus=""
          disabled={isImporting$.attribute()}
          placeholder="Paste a shared list link"
          value={value$.attribute()}
          onInput={(event) => {
            value$.set(event.target.value);
            error$.set(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.isComposing) return;
            event.preventDefault();
            void importList();
          }}
        />
      </div>
      {error$.render((error) =>
        error ? (
          <p class={styles.error} role="alert">
            {error}
          </p>
        ) : null,
      )}
      <div class={styles.actions}>
        <Button disabled={isImporting$.attribute()} onClick={close}>
          Cancel
        </Button>
        <Button disabled={importDisabled$.attribute()} onClick={() => void importList()}>
          Import
        </Button>
      </div>
    </Modal>
  );
}
