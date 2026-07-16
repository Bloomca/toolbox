import type { StorageBackend } from "./types";

type StorageProvider = () => Storage;

export class LocalStorageBackend implements StorageBackend {
  constructor(
    private readonly storageProvider: StorageProvider = () => globalThis.localStorage,
    private readonly prefix = "toolbox",
  ) {}

  async read(namespace: string, key: string): Promise<unknown | undefined> {
    const value = this.storageProvider().getItem(this.storageKey(namespace, key));
    return value === null ? undefined : JSON.parse(value);
  }

  async write(namespace: string, key: string, value: unknown): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (serializedValue === undefined) {
      throw new TypeError("The stored value must be JSON-serializable.");
    }

    this.storageProvider().setItem(this.storageKey(namespace, key), serializedValue);
  }

  async remove(namespace: string, key: string): Promise<void> {
    this.storageProvider().removeItem(this.storageKey(namespace, key));
  }

  private storageKey(namespace: string, key: string): string {
    return `${this.prefix}:${encodeURIComponent(namespace)}:${encodeURIComponent(key)}`;
  }
}
