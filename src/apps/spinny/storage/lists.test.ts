/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { createAppStorage, localStorageBackend } from "../../../storage";
import type { EditableChoice } from "../types";
import { deleteSpinnyList, readSpinnyLists, saveSpinnyList, updateSpinnyList } from "./lists";

const storage = createAppStorage("spinny", localStorageBackend);

const choices: EditableChoice[] = [
  { id: "sun", label: "Sun", weight: 1, included: true, parentChoiceId: null },
  { id: "rain", label: "Rain", weight: 1, included: false, parentChoiceId: null },
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
          { id: "sun", label: "Sun", weight: 1, included: true, parentChoiceId: null },
          { id: "rain", label: "Rain", weight: 1, included: false, parentChoiceId: null },
        ],
      },
    ]);
  });

  test("allows duplicate titles", async () => {
    await saveSpinnyList({ title: "Weather", choices });
    await saveSpinnyList({ title: "  WEATHER ", choices });

    expect((await readSpinnyLists()).map((list) => list.title)).toEqual(["Weather", "WEATHER"]);
  });

  test("deletes a saved list", async () => {
    const firstList = await saveSpinnyList({ title: "Weather", choices });
    const secondList = await saveSpinnyList({ title: "Forecast", choices });

    await deleteSpinnyList(firstList.id);

    await expect(readSpinnyLists()).resolves.toEqual([secondList]);
  });

  test("updates a saved list in place", async () => {
    const savedList = await saveSpinnyList({ title: "Weather", choices });
    const updatedList = await updateSpinnyList({
      id: savedList.id,
      title: "  Forecast  ",
      choices: [{ id: "cloud", label: "Cloud", weight: 2, included: true, parentChoiceId: null }],
    });

    expect(updatedList).toEqual({
      id: savedList.id,
      title: "Forecast",
      choices: [{ id: "cloud", label: "Cloud", weight: 2, included: true, parentChoiceId: null }],
    });
    await expect(readSpinnyLists()).resolves.toEqual([updatedList]);
  });

  test("allows an update to use another list's title", async () => {
    await saveSpinnyList({ title: "Weather", choices });
    const secondList = await saveSpinnyList({ title: "Forecast", choices });

    await expect(
      updateSpinnyList({ id: secondList.id, title: " WEATHER ", choices }),
    ).resolves.toMatchObject({ title: "WEATHER" });
    expect((await readSpinnyLists()).map((list) => list.title)).toEqual(["Weather", "WEATHER"]);
  });

  test("serializes concurrent saves", async () => {
    await Promise.all([
      saveSpinnyList({ title: "First", choices }),
      saveSpinnyList({ title: "Second", choices }),
    ]);

    expect((await readSpinnyLists()).map((list) => list.title)).toEqual(["First", "Second"]);
  });

  test("treats choices saved before nesting support as top-level choices", async () => {
    await storage.write("lists", [
      {
        id: "legacy",
        title: "Legacy",
        choices: [{ id: "sun", label: "Sun", weight: 1, included: true }],
      },
    ]);

    expect((await readSpinnyLists())[0].choices[0].parentChoiceId).toBeNull();
  });

  test("ignores malformed saved lists", async () => {
    await storage.write("lists", [{ title: "Missing fields" }, null]);

    await expect(readSpinnyLists()).resolves.toEqual([]);
  });
});
