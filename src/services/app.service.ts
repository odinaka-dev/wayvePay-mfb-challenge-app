import * as z from "zod";

import {
  accountSchema,
  banksResponseSchema,
  resolvedAccountSchema,
  transactionHistorySchema,
  transactionSchema,
  transferStatusSchema,
  type BankParams,
  type resolvedAccountParams,
  type transactionHistoryParams,
  type transactionParams,
  type transferParams,
  type transferResolve,
  type transferStatus,
  type transferStatusParams,
  type userDataParams,
} from "@/types/api";
import { MalformedResponseError } from "@/lib/errors";
import type { TransactionQuery } from "@/lib/transactions";

import { apiClient } from "./api-client";

/** Validates a response body against the contract. The payload itself is never logged. */
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new MalformedResponseError();
  return result.data;
}

// get user data
export const getUserDetails = async (signal?: AbortSignal): Promise<userDataParams> => {
  const response = await apiClient.get("/account", { signal });
  return parse(accountSchema, response.data);
};

// get transaction data. `signal` lets React Query cancel a request whose filters are stale.
export const getTransactionHistory = async (
  query: TransactionQuery,
  signal?: AbortSignal,
): Promise<transactionHistoryParams> => {
  const response = await apiClient.get("/transactions", { params: query, signal });
  return parse(transactionHistorySchema, response.data);
};

// get transaction details by id
export const getTransactionDetails = async (
  id: string,
  signal?: AbortSignal,
): Promise<transactionParams> => {
  const response = await apiClient.get(`/transactions/${encodeURIComponent(id)}`, { signal });
  return parse(transactionSchema, response.data);
};

// The server reads the idempotency key from the header, not the body.
// Retrying with the same key returns the original transfer instead of debiting twice.
export const transferServices = async ({
  idempotencyKey,
  ...data
}: transferParams): Promise<transferStatusParams> => {
  const response = await apiClient.post("/transfers", data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return parse(transferStatusSchema, response.data);
};

export const resolveAccount = async (
  data: transferResolve,
  signal?: AbortSignal,
): Promise<resolvedAccountParams> => {
  const response = await apiClient.post("/transfers/resolve-account", data, { signal });
  return parse(resolvedAccountSchema, response.data);
};

export const getBanks = async (signal?: AbortSignal): Promise<BankParams[]> => {
  const response = await apiClient.get("/banks", { signal });
  return parse(banksResponseSchema, response.data).items;
};

export const getTransferStatus = async (
  id: string,
  signal?: AbortSignal,
): Promise<transferStatusParams> => {
  const response = await apiClient.get(`/transfers/${encodeURIComponent(id)}/status`, { signal });
  return parse(transferStatusSchema, response.data);
};

// settles a pending mock transfer (mock API extension, dev builds only).
export const setMockTransferStatus = async (
  id: string,
  status: Exclude<transferStatus, "pending">,
): Promise<transferStatusParams> => {
  const response = await apiClient.post(`/mock/transfers/${encodeURIComponent(id)}/status`, {
    status,
  });
  return parse(transferStatusSchema, response.data);
};
