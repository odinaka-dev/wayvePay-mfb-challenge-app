import type { KeyValueStore } from "./storage";

export type { KeyValueStore } from "./storage";

// expo-secure-store has no web implementation. Web is only a dev preview for this app,
// so fall back to localStorage there.
export const secureStorage: KeyValueStore = {
  getItem: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: async (key) => globalThis.localStorage?.removeItem(key),
};
