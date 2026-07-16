export { AppStorage, createAppStorage } from "./app-storage";
export { LocalStorageBackend } from "./local-storage-backend";
export type { StorageBackend } from "./types";

import { LocalStorageBackend } from "./local-storage-backend";

export const localStorageBackend = new LocalStorageBackend();
