import { createAppStorage, localStorageBackend } from "../../../storage";
import type { EditableChoice, SavedSpinnyList } from "../types";

const LISTS_STORAGE_KEY = "lists";
const storage = createAppStorage("spinny", localStorageBackend);
let writeQueue = Promise.resolve();

export class DuplicateListTitleError extends Error {
  constructor(title: string) {
    super(`A Spinny list named "${title}" already exists.`);
    this.name = "DuplicateListTitleError";
  }
}

export async function readSpinnyLists(): Promise<SavedSpinnyList[]> {
  const storedValue = await storage.read(LISTS_STORAGE_KEY);
  if (!Array.isArray(storedValue)) return [];
  return storedValue.filter(isSavedSpinnyList);
}

export function saveSpinnyList({
  title,
  choices,
}: {
  title: string;
  choices: readonly EditableChoice[];
}): Promise<SavedSpinnyList> {
  const normalizedTitle = normalizeListTitle(title);
  if (!normalizedTitle) return Promise.reject(new TypeError("A Spinny list needs a title."));

  const operation = writeQueue.then(async () => {
    const lists = await readSpinnyLists();
    if (lists.some((list) => normalizeListTitle(list.title) === normalizedTitle)) {
      throw new DuplicateListTitleError(title.trim());
    }

    const list: SavedSpinnyList = {
      id: createListId(),
      title: title.trim(),
      choices: choices.map((choice) => ({ ...choice })),
    };
    lists.push(list);
    await storage.write(LISTS_STORAGE_KEY, lists);
    return list;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export function normalizeListTitle(title: string): string {
  return title.trim().toLowerCase();
}

function isSavedSpinnyList(value: unknown): value is SavedSpinnyList {
  if (typeof value !== "object" || value === null) return false;

  const list = value as Partial<SavedSpinnyList>;
  return (
    typeof list.id === "string" &&
    typeof list.title === "string" &&
    normalizeListTitle(list.title).length > 0 &&
    Array.isArray(list.choices) &&
    list.choices.every(isEditableChoice)
  );
}

function isEditableChoice(value: unknown): value is EditableChoice {
  if (typeof value !== "object" || value === null) return false;

  const choice = value as Partial<EditableChoice>;
  return (
    typeof choice.id === "string" &&
    typeof choice.label === "string" &&
    typeof choice.weight === "number" &&
    Number.isFinite(choice.weight) &&
    choice.weight > 0 &&
    typeof choice.included === "boolean"
  );
}

function createListId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `list-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
