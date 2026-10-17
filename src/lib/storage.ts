import * as SecureStore from "expo-secure-store";

/** Minimal async key-value store, so persistence can be swapped for an in-memory fake in tests. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Encrypted on device (Keychain / Keystore). Used for anything containing account details. */
export const secureStorage: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
