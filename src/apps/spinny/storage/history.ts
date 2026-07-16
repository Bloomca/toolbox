import { createAppStorage, localStorageBackend } from "../../../storage";
import type { WheelChoice } from "../wheel";

const HISTORY_STORAGE_KEY = "history";
const storage = createAppStorage("spinny", localStorageBackend);
let writeQueue = Promise.resolve();

export type SpinHistoryEntry = {
  winner: Pick<WheelChoice, "id" | "label">;
  timestamp: number;
};

export async function readSpinHistory(): Promise<SpinHistoryEntry[]> {
  const storedValue = await storage.read(HISTORY_STORAGE_KEY);
  if (!Array.isArray(storedValue)) return [];
  return storedValue.filter(isSpinHistoryEntry);
}

export function appendSpinHistory(entry: SpinHistoryEntry): Promise<void> {
  const operation = writeQueue.then(async () => {
    const history = await readSpinHistory();
    history.push(entry);
    await storage.write(HISTORY_STORAGE_KEY, history);
  });

  writeQueue = operation.catch(() => undefined);
  return operation;
}

function isSpinHistoryEntry(value: unknown): value is SpinHistoryEntry {
  if (typeof value !== "object" || value === null) return false;

  const entry = value as Partial<SpinHistoryEntry>;
  return (
    typeof entry.timestamp === "number" &&
    Number.isFinite(entry.timestamp) &&
    typeof entry.winner === "object" &&
    entry.winner !== null &&
    typeof entry.winner.id === "string" &&
    typeof entry.winner.label === "string"
  );
}
