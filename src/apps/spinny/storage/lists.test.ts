/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { createAppStorage, localStorageBackend } from "../../../storage";
import type { EditableChoice } from "../types";
import { DuplicateListTitleError, readSpinnyLists, saveSpinnyList } from "./lists";

const storage = createAppStorage("spinny", localStorageBackend);

const choices: EditableChoice[] = [
  { id: "sun", label: "Sun", weight: 1, included: true },
  { id: "rain", label: "Rain", weight: 1, included: false },
];

afterEach(() => {
  localStorage.clear();
});

describe("Spinny list storage", () => {
  test("returns an empty array when no lists have been saved", async () => {
    await expect(readSpinnyLists()).resolves.toEqual([]);
  });

  test("saves a trimmed title and choice snapshot", async () => {
    const editableChoices = choices.map((choice) => ({ ...choice }));
    const savedList = await saveSpinnyList({ title: "  Weather  ", choices: editableChoices });
    editableChoices[0].label = "Changed after saving";

    expect(savedList.title).toBe("Weather");
    expect(savedList.id).toBeTruthy();
    await expect(readSpinnyLists()).resolves.toEqual([
      {
        ...savedList,
        choices: [
          { id: "sun", label: "Sun", weight: 1, included: true },
          { id: "rain", label: "Rain", weight: 1, included: false },
        ],
      },
    ]);
  });

  test("rejects duplicate titles after trimming and case folding", async () => {
    await saveSpinnyList({ title: "Weather", choices });

    await expect(saveSpinnyList({ title: "  WEATHER ", choices })).rejects.toBeInstanceOf(
      DuplicateListTitleError,
    );
  });

  test("serializes concurrent saves", async () => {
    await Promise.all([
      saveSpinnyList({ title: "First", choices }),
      saveSpinnyList({ title: "Second", choices }),
    ]);

    expect((await readSpinnyLists()).map((list) => list.title)).toEqual(["First", "Second"]);
  });

  test("ignores malformed saved lists", async () => {
    await storage.write("lists", [{ title: "Missing fields" }, null]);

    await expect(readSpinnyLists()).resolves.toEqual([]);
  });
});
