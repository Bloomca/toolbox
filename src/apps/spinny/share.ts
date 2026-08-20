import type { SavedSpinnyList } from "./types";

const SHARE_ENDPOINT = "/api/spinny/share";
const SHARED_LIST_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

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
