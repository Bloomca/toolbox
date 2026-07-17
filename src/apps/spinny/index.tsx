import { createState, onMount, onUnmount } from "veles";

import { useConfirmation } from "../../design/confirmation";
import { ChoiceEditor } from "./choice-editor";
import { SpinnerPanel } from "./spinner-panel";
import { deleteSpinnyList, readSpinnyLists, saveSpinnyList, updateSpinnyList } from "./storage";
import styles from "./style.module.css";
import type { EditableChoice, SavedSpinnyList } from "./types";
import type { WheelChoice } from "./wheel";

const INITIAL_CHOICES: readonly EditableChoice[] = [
  { id: "sun", label: "Sun", weight: 1, included: true, parentChoiceId: null },
  { id: "water", label: "Water", weight: 1, included: true, parentChoiceId: null },
  { id: "earth", label: "Earth", weight: 1, included: true, parentChoiceId: null },
  { id: "wind", label: "Wind", weight: 1, included: true, parentChoiceId: null },
  { id: "fire", label: "Fire", weight: 1, included: true, parentChoiceId: null },
  { id: "sky", label: "Sky", weight: 1, included: true, parentChoiceId: null },
  { id: "air", label: "Air", weight: 1, included: true, parentChoiceId: null },
  { id: "ocean", label: "Ocean", weight: 1, included: true, parentChoiceId: null },
  { id: "sand", label: "Sand", weight: 1, included: true, parentChoiceId: null },
];

export function SpinnyApp() {
  const confirm = useConfirmation();
  const listTitle$ = createState("New List");
  const savedLists$ = createState<SavedSpinnyList[]>([]);
  const selectedListId$ = createState<string | null>(null);
  const listsLoaded$ = createState(false);
  const isSaving$ = createState(false);
  const choices$ = createState<EditableChoice[]>(createDefaultChoices());
  const isSpinning$ = createState(false);
  const saveDisabled$ = listTitle$
    .combine(isSpinning$, isSaving$, listsLoaded$)
    .map(
      ([title, isSpinning, isSaving, listsLoaded]) =>
        !listsLoaded || isSpinning || isSaving || !title.trim(),
    );
  const result$ = createState<WheelChoice | null>(null);
  let mounted = true;

  onMount(() => {
    void readSpinnyLists()
      .then((lists) => {
        if (mounted) savedLists$.set(lists);
      })
      .catch((error) => console.error("Could not load Spinny lists.", error))
      .finally(() => {
        if (mounted) listsLoaded$.set(true);
      });
  });

  onUnmount(() => {
    mounted = false;
  });

  function clearResult() {
    result$.set(null);
  }

  function resetToNewList() {
    selectedListId$.set(null);
    listTitle$.set("New List");
    choices$.set(createDefaultChoices());
    clearResult();
  }

  function createNewList() {
    if (!selectedListId$.get() || isSaving$.get() || isSpinning$.get()) return;
    resetToNewList();
  }

  async function saveList() {
    const title = listTitle$.get().trim();
    if (!listsLoaded$.get() || isSaving$.get() || isSpinning$.get() || !title) return;

    isSaving$.set(true);
    try {
      const savedList = await saveSpinnyList({ title, choices: choices$.get() });
      if (mounted) selectedListId$.set(savedList.id);
    } catch (error) {
      console.error("Could not save Spinny list.", error);
    }

    try {
      const lists = await readSpinnyLists();
      if (mounted) savedLists$.set(lists);
    } catch (error) {
      console.error("Could not reload Spinny lists.", error);
    } finally {
      if (mounted) isSaving$.set(false);
    }
  }

  async function deleteList() {
    const id = selectedListId$.get();
    if (!id || isSaving$.get() || isSpinning$.get()) return;

    const savedTitle = savedLists$.get().find((list) => list.id === id)?.title ?? listTitle$.get();
    const confirmed = await confirm({
      title: `Delete “${savedTitle}”?`,
      message: "This saved list will be permanently deleted.",
      confirmLabel: "Delete list",
      tone: "danger",
    });
    if (!confirmed || !mounted || selectedListId$.get() !== id) return;

    isSaving$.set(true);
    try {
      await deleteSpinnyList(id);
      const lists = await readSpinnyLists();
      if (mounted) {
        resetToNewList();
        savedLists$.set(lists);
      }
    } catch (error) {
      console.error("Could not delete Spinny list.", error);
    } finally {
      if (mounted) isSaving$.set(false);
    }
  }

  async function updateList() {
    const id = selectedListId$.get();
    if (!id || isSaving$.get() || isSpinning$.get()) return;

    isSaving$.set(true);
    try {
      await updateSpinnyList({ id, title: listTitle$.get(), choices: choices$.get() });
    } catch (error) {
      console.error("Could not update Spinny list.", error);
    }

    try {
      const lists = await readSpinnyLists();
      if (mounted) savedLists$.set(lists);
    } catch (error) {
      console.error("Could not reload Spinny lists.", error);
    } finally {
      if (mounted) isSaving$.set(false);
    }
  }

  function selectList(id: string) {
    if (isSpinning$.get()) return;

    const list = savedLists$.get().find((list) => list.id === id);
    if (!list) return;

    selectedListId$.set(list.id);
    listTitle$.set(list.title);
    choices$.set(list.choices.map((choice) => ({ ...choice })));
    clearResult();
  }

  return (
    <div class={styles.app}>
      <SpinnerPanel choices$={choices$} isSpinning$={isSpinning$} result$={result$} />

      <ChoiceEditor
        title$={listTitle$}
        choices$={choices$}
        savedLists$={savedLists$}
        selectedListId$={selectedListId$}
        listsLoaded$={listsLoaded$}
        disabled$={isSpinning$}
        saveDisabled$={saveDisabled$}
        onCreateNewList={createNewList}
        onDeleteList={deleteList}
        onEdit={clearResult}
        onSave={saveList}
        onSelectList={selectList}
        onUpdate={updateList}
      />
    </div>
  );
}

function createDefaultChoices(): EditableChoice[] {
  return INITIAL_CHOICES.map((choice) => ({ ...choice }));
}
