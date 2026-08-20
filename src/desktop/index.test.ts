/** @vitest-environment happy-dom */

import { afterEach, describe, expect, test } from "vitest";

import { windowState$ } from "../state/window";
import { openSpinnyForSharedList } from ".";

const sharedId = "P-dSPfBNzTcitZLJy2dLEw";

afterEach(() => {
  windowState$.set({ windows: [], activeWindow: null });
});

describe("shared Spinny links", () => {
  test("opens Spinny and reuses an existing Spinny window", () => {
    openSpinnyForSharedList(`https://toolbox.bloomca.me/?share_list_id=${sharedId}`);

    const openedWindow = windowState$.get().windows[0];
    expect(openedWindow?.appId).toBe("spinny");
    expect(windowState$.get().activeWindow).toBe(openedWindow.id);

    windowState$.update((state) => ({ ...state, activeWindow: null }));
    openSpinnyForSharedList(`https://toolbox.bloomca.me/?share_list_id=${sharedId}`);

    expect(windowState$.get().windows).toHaveLength(1);
    expect(windowState$.get().activeWindow).toBe(openedWindow.id);
  });

  test("ignores URLs without a valid shared list ID", () => {
    openSpinnyForSharedList("https://toolbox.bloomca.me/?share_list_id=invalid");

    expect(windowState$.get().windows).toHaveLength(0);
  });
});
