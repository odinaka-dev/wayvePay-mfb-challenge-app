import type { transactionParams } from "@/types/api";

let counter = 0;

export function makeTransaction(overrides: Partial<transactionParams> = {}): transactionParams {
  counter += 1;
  const n = String(counter).padStart(4, "0");
  return {
    id: `txn_${n}`,
    reference: `WAYVE-2026-${n}`,
    amountMinor: 250000,
    currency: "NGN",
    type: "debit",
    status: "successful",
    description: "Transfer to merchant",
    createdAt: "2026-10-15T12:30:00.000Z",
    feeMinor: 0,
    ...overrides,
  };
}

/** In-memory KeyValueStore for coordinator tests. Shared instances simulate an app restart. */
export function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
  };
}
