import { createState, onMount, onUnmount } from "veles";

import { useConfirmation } from "../../design/confirmation";
import { ChoiceEditor } from "./choice-editor";
import { ImportListModal } from "./import-list-modal";
import { SpinnerPanel } from "./spinner-panel";
import { getSharedSpinnyList, parseSharedSpinnyListId, shareSpinnyList } from "./share";
import { SharedListModal } from "./shared-list-modal";
import {
  deleteSpinnyList,
  markSpinnyListShared,
  readSpinnyLists,
  saveImportedSpinnyList,
  saveSpinnyList,
  updateSpinnyList,
} from "./storage";
import styles from "./style.module.css";
import type { EditableChoice, SavedSpinnyList } from "./types";
import type { WheelChoice } from "./wheel";

type ImportModalOptions = {
  initialValue: string;
  autoImport: boolean;
};

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
  const selectedCategoryPath$ = createState<string[]>([]);
  const isSpinning$ = createState(false);
  const editorDisabled$ = isSpinning$
    .combine(isSaving$)
    .map(([isSpinning, isSaving]) => isSpinning || isSaving);
  const selectedListShared$ = selectedListId$
    .combine(savedLists$)
    .map(
      ([selectedListId, savedLists]) =>
        savedLists.find((list) => list.id === selectedListId)?.shared === true,
    );
  const saveDisabled$ = listTitle$
    .combine(isSpinning$, isSaving$, listsLoaded$)
    .map(
      ([title, isSpinning, isSaving, listsLoaded]) =>
        !listsLoaded || isSpinning || isSaving || !title.trim(),
    );
  const result$ = createState<WheelChoice | null>(null);
  const importModal$ = createState<ImportModalOptions | null>(null);
  const sharedListLink$ = createState<string | null>(null);
  let mounted = true;

  onMount(() => {
    void readSpinnyLists()
      .then((lists) => {
        if (mounted) savedLists$.set(lists);
      })
      .catch((error) => console.error("Could not load Spinny lists.", error))
      .finally(() => {
        if (!mounted) return;

        listsLoaded$.set(true);
        const sharedListId = parseSharedSpinnyListId(window.location.href);
        if (sharedListId) {
          importModal$.set({
            initialValue: createSharedListLink(sharedListId),
            autoImport: true,
          });
        }
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
    selectedCategoryPath$.set([]);
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

  async function importList(value: string) {
    const id = parseSharedSpinnyListId(value);
    if (!id) throw new Error("Enter a valid shared list link.");
    if (!listsLoaded$.get() || isSaving$.get() || isSpinning$.get()) {
      throw new Error("Lists are currently busy. Try again shortly.");
    }

    if (savedLists$.get().some((list) => list.id === id)) {
      selectList(id);
      return;
    }

    isSaving$.set(true);
    try {
      const importedList = await getSharedSpinnyList(id);
      await saveImportedSpinnyList(importedList);
      const lists = await readSpinnyLists();
      if (mounted) {
        savedLists$.set(lists);
        selectedListId$.set(importedList.id);
        listTitle$.set(importedList.title);
        choices$.set(importedList.choices.map((choice) => ({ ...choice })));
        selectedCategoryPath$.set([]);
        clearResult();
      }
    } finally {
      if (mounted) isSaving$.set(false);
    }
  }

  async function shareList() {
    const id = selectedListId$.get();
    const title = listTitle$.get().trim();
    const selectedList = savedLists$.get().find((list) => list.id === id);
    if (!id || !selectedList || !listsLoaded$.get() || isSaving$.get() || isSpinning$.get()) {
      return;
    }

    if (selectedList.shared) {
      sharedListLink$.set(createSharedListLink(id));
      return;
    }
    if (!title) return;

    const list: SavedSpinnyList = {
      id,
      title,
      choices: choices$.get().map((choice) => ({ ...choice })),
    };

    isSaving$.set(true);
    try {
      const sharedId = await shareSpinnyList(list);
      await markSpinnyListShared({
        id,
        sharedId,
        title: list.title,
        choices: list.choices,
      });
      const lists = await readSpinnyLists();
      if (mounted) {
        savedLists$.set(lists);
        selectedListId$.set(sharedId);
        sharedListLink$.set(createSharedListLink(sharedId));
      }
    } catch (error) {
      console.error("Could not share Spinny list.", error);
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
    const selectedList = savedLists$.get().find((list) => list.id === id);
    if (!id || selectedList?.shared || isSaving$.get() || isSpinning$.get()) return;

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
    if (isSpinning$.get() || isSaving$.get()) return;

    const list = savedLists$.get().find((list) => list.id === id);
    if (!list) return;

    selectedListId$.set(list.id);
    listTitle$.set(list.title);
    choices$.set(list.choices.map((choice) => ({ ...choice })));
    selectedCategoryPath$.set([]);
    clearResult();
  }

  return (
    <div class={styles.app}>
      <SpinnerPanel
        listTitle$={listTitle$}
        choices$={choices$}
        selectedCategoryPath$={selectedCategoryPath$}
        isSpinning$={isSpinning$}
        result$={result$}
      />

      <ChoiceEditor
        title$={listTitle$}
        choices$={choices$}
        savedLists$={savedLists$}
        selectedListId$={selectedListId$}
        listsLoaded$={listsLoaded$}
        disabled$={editorDisabled$}
        saveDisabled$={saveDisabled$}
        shared$={selectedListShared$}
        onCreateNewList={createNewList}
        onDeleteList={deleteList}
        onEdit={clearResult}
        onImportList={() => importModal$.set({ initialValue: "", autoImport: false })}
        onSave={saveList}
        onSelectList={selectList}
        onShare={shareList}
        onUpdate={updateList}
      />

      {importModal$.render((options) =>
        options ? (
          <ImportListModal
            {...options}
            onImport={importList}
            onClose={() => importModal$.set(null)}
          />
        ) : null,
      )}

      {sharedListLink$.render((link) =>
        link ? <SharedListModal link={link} onClose={() => sharedListLink$.set(null)} /> : null,
      )}
    </div>
  );
}

function createSharedListLink(id: string): string {
  const url = new URL("/", window.location.origin);
  url.searchParams.set("share_list_id", id);
  return url.toString();
}

function createDefaultChoices(): EditableChoice[] {
  return INITIAL_CHOICES.map((choice) => ({ ...choice }));
}
