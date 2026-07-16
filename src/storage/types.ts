export interface StorageBackend {
  read(namespace: string, key: string): Promise<unknown | undefined>;
  write(namespace: string, key: string, value: unknown): Promise<void>;
  remove(namespace: string, key: string): Promise<void>;
}
