/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { createAppStorage } from "./app-storage";
import { LocalStorageBackend } from "./local-storage-backend";

const backend = new LocalStorageBackend(() => localStorage, "test-toolbox");

const firstAppStorage = createAppStorage("first-app", backend);
const secondAppStorage = createAppStorage("second-app", backend);

afterEach(() => {
  localStorage.clear();
});

describe("LocalStorageBackend", () => {
  test("stores and reads structured values asynchronously", async () => {
    const value = { enabled: true, entries: ["one", "two"] };

    await firstAppStorage.write("state", value);

    await expect(firstAppStorage.read("state")).resolves.toEqual(value);
  });

  test("isolates values by app namespace", async () => {
    await firstAppStorage.write("state", { owner: "first" });

    await expect(secondAppStorage.read("state")).resolves.toBeUndefined();
  });

  test("removes values", async () => {
    await firstAppStorage.write("state", { saved: true });

    await firstAppStorage.remove("state");

    await expect(firstAppStorage.read("state")).resolves.toBeUndefined();
  });

  test("rejects values that JSON cannot serialize", async () => {
    await expect(firstAppStorage.write("state", undefined)).rejects.toThrow(
      "The stored value must be JSON-serializable.",
    );
  });
});
