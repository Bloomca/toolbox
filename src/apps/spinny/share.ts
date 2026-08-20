import { isSavedSpinnyList } from "./storage";
import type { SavedSpinnyList } from "./types";

const SHARE_ENDPOINT = "/api/spinny/share";
const SHARED_LIST_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export function parseSharedSpinnyListId(value: string): string | null {
  const trimmedValue = value.trim();
  if (SHARED_LIST_ID_PATTERN.test(trimmedValue)) return trimmedValue;

  try {
    const id = new URL(trimmedValue, window.location.origin).searchParams.get("share_list_id");
    return id && SHARED_LIST_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export async function getSharedSpinnyList(id: string): Promise<SavedSpinnyList> {
  if (!SHARED_LIST_ID_PATTERN.test(id)) throw new Error("Enter a valid shared list link.");

  const response = await fetch(`${SHARE_ENDPOINT}/${encodeURIComponent(id)}`);
  if (response.status === 404) throw new Error("The shared list was not found.");
  if (!response.ok) {
    throw new Error(`Could not import shared list: server returned ${response.status}.`);
  }

  const responseBody: unknown = await response.json().catch(() => null);
  if (
    typeof responseBody !== "object" ||
    responseBody === null ||
    !("id" in responseBody) ||
    responseBody.id !== id ||
    !("data" in responseBody) ||
    typeof responseBody.data !== "string"
  ) {
    throw new Error("Could not import shared list: server returned an invalid response.");
  }

  let storedList: unknown;
  try {
    storedList = JSON.parse(responseBody.data);
  } catch {
    throw new Error("Could not import shared list: stored list is invalid.");
  }
  if (!isSavedSpinnyList(storedList)) {
    throw new Error("Could not import shared list: stored list is invalid.");
  }

  return {
    id: responseBody.id,
    title: storedList.title.trim(),
    choices: storedList.choices.map((choice) => ({
      ...choice,
      parentChoiceId: choice.parentChoiceId ?? null,
    })),
    shared: true,
  };
}

export async function shareSpinnyList(list: SavedSpinnyList): Promise<string> {
  const response = await fetch(SHARE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: JSON.stringify({
        id: list.id,
        title: list.title,
        choices: list.choices,
      }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not share Spinny list: server returned ${response.status}.`);
  }

  const responseBody: unknown = await response.json();
  if (
    typeof responseBody !== "object" ||
    responseBody === null ||
    !("id" in responseBody) ||
    typeof responseBody.id !== "string" ||
    !SHARED_LIST_ID_PATTERN.test(responseBody.id)
  ) {
    throw new Error("Could not share Spinny list: server returned an invalid ID.");
  }

  return responseBody.id;
}
