import type { StorageBackend } from "./types";

export class AppStorage {
  constructor(
    private readonly namespace: string,
    private readonly backend: StorageBackend,
  ) {}

  read(key: string): Promise<unknown | undefined> {
    return this.backend.read(this.namespace, key);
  }

  write(key: string, value: unknown): Promise<void> {
    return this.backend.write(this.namespace, key, value);
  }

  remove(key: string): Promise<void> {
    return this.backend.remove(this.namespace, key);
  }
}

export function createAppStorage(namespace: string, backend: StorageBackend): AppStorage {
  return new AppStorage(namespace, backend);
}
