/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { createAppStorage, localStorageBackend } from "../../../storage";
import { appendSpinHistory, readSpinHistory, type SpinHistoryEntry } from "./history";

const storage = createAppStorage("spinny", localStorageBackend);

const firstEntry: SpinHistoryEntry = {
  winner: { id: "sun", label: "Sun" },
  timestamp: 1_700_000_000_000,
};

const secondEntry: SpinHistoryEntry = {
  winner: { id: "water", label: "Water" },
  timestamp: 1_700_000_001_000,
};

afterEach(() => {
  localStorage.clear();
});

describe("Spinny history", () => {
  test("returns an empty history when none has been saved", async () => {
    await expect(readSpinHistory()).resolves.toEqual([]);
  });

  test("appends winner snapshots and timestamps", async () => {
    await Promise.all([appendSpinHistory(firstEntry), appendSpinHistory(secondEntry)]);

    await expect(readSpinHistory()).resolves.toEqual([firstEntry, secondEntry]);
  });

  test("ignores malformed stored entries", async () => {
    await storage.write("history", [firstEntry, { winner: null }, "invalid"]);

    await expect(readSpinHistory()).resolves.toEqual([firstEntry]);
  });
});
