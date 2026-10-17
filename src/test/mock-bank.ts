import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";

import type { transactionParams, transferStatusParams } from "@/types/api";

/**
 * Deterministic in-memory implementation of the Wayve mock API, plugged into axios as an
 * adapter. Tests drive scenarios explicitly instead of relying on timing or a network.
 *
 * Transfer scenarios (set `nextTransfer` before submitting):
 * - "pending"                   accepted, settles later via `settle()`
 * - "successful"                accepted and settled immediately
 * - "timeout-after-processing"  creates the transfer, then the client times out
 * - "server-error"              500 before anything is created
 */
export type TransferScenario = "pending" | "successful" | "timeout-after-processing" | "server-error";

export const FEE_MINOR = 2500;

type Reply = { status: number; data: unknown };

export function createMockBank({ balanceMinor = 25_000_000 } = {}) {
  const bank = {
    balanceMinor,
    nextTransfer: "pending" as TransferScenario,
    sessionExpired: false,
    transfersByKey: new Map<string, transferStatusParams>(),
    transfersById: new Map<string, transferStatusParams>(),
    transactions: [] as transactionParams[],
    requests: [] as { method: string; url: string; idempotencyKey?: string }[],

    settle(id: string, status: "successful" | "failed") {
      const transfer = bank.transfersById.get(id);
      if (!transfer) throw new Error(`No transfer ${id}`);
      transfer.status = status;
      if (status === "failed") bank.balanceMinor += transfer.totalDebitMinor;
    },

    transferPosts() {
      return bank.requests.filter((r) => r.method === "post" && r.url === "/transfers");
    },
  };

  const handle = (config: InternalAxiosRequestConfig): Reply | "timeout" => {
    const method = (config.method ?? "get").toLowerCase();
    const url = (config.url ?? "").split("?")[0];
    const headers = AxiosHeaders.from(config.headers);
    const idempotencyKey = headers.get("Idempotency-Key")?.toString();
    const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    bank.requests.push({ method, url, idempotencyKey });

    if (bank.sessionExpired) return { status: 401, data: { message: "Token expired", code: "UNAUTHORIZED" } };

    if (method === "get" && url === "/account") {
      return {
        status: 200,
        data: {
          accountId: "acc_001",
          accountNumber: "0123456789",
          accountName: "Ada Okafor",
          currency: "NGN",
          availableBalanceMinor: bank.balanceMinor,
        },
      };
    }

    if (method === "post" && url === "/transfers/resolve-account") {
      if (!/^\d{10}$/.test(body.accountNumber)) {
        return { status: 400, data: { message: "Bad account", code: "INVALID_ACCOUNT_NUMBER" } };
      }
      return {
        status: 200,
        data: { accountName: "Demo Recipient", bankCode: body.bankCode, bankName: "Access Bank", accountNumber: body.accountNumber },
      };
    }

    if (method === "post" && url === "/transfers") {
      if (!idempotencyKey) return { status: 400, data: { message: "Missing key", code: "MISSING_IDEMPOTENCY_KEY" } };
      const existing = bank.transfersByKey.get(idempotencyKey);
      if (existing) return { status: 200, data: { ...existing } };

      if (bank.nextTransfer === "server-error") return { status: 500, data: { message: "boom" } };

      const totalDebitMinor = body.amountMinor + FEE_MINOR;
      if (totalDebitMinor > bank.balanceMinor) {
        return { status: 422, data: { message: "Insufficient funds", code: "INSUFFICIENT_FUNDS" } };
      }

      const id = `txn_transfer_${bank.transfersById.size + 1}`;
      const now = "2026-10-17T10:00:00.000Z";
      const transfer: transferStatusParams = {
        transactionId: id,
        reference: `WAYVE-TRANSFER-${bank.transfersById.size + 1}`,
        status: bank.nextTransfer === "successful" ? "successful" : "pending",
        amountMinor: body.amountMinor,
        currency: "NGN",
        recipientBankCode: body.recipientBankCode,
        recipientAccountNumber: body.recipientAccountNumber,
        recipientName: "Demo Recipient",
        feeMinor: FEE_MINOR,
        totalDebitMinor,
        narration: body.narration,
        createdAt: now,
        updatedAt: now,
      };
      bank.balanceMinor -= totalDebitMinor;
      bank.transfersByKey.set(idempotencyKey, transfer);
      bank.transfersById.set(id, transfer);

      if (bank.nextTransfer === "timeout-after-processing") {
        // Only the first attempt times out; a replay with the same key gets an answer.
        bank.nextTransfer = "pending";
        return "timeout";
      }
      return { status: 201, data: { ...transfer } };
    }

    const statusMatch = /^\/transfers\/([^/]+)\/status$/.exec(url);
    if (method === "get" && statusMatch) {
      const transfer = bank.transfersById.get(decodeURIComponent(statusMatch[1]));
      return transfer
        ? { status: 200, data: { ...transfer } }
        : { status: 404, data: { message: "Transfer not found", code: "TRANSFER_NOT_FOUND" } };
    }

    if (method === "get" && url === "/transactions") {
      const { page = 1, limit = 20 } = config.params ?? {};
      const start = (page - 1) * limit;
      const items = bank.transactions.slice(start, start + limit);
      return {
        status: 200,
        data: { items, page, limit, total: bank.transactions.length, hasMore: start + limit < bank.transactions.length },
      };
    }

    return { status: 404, data: { message: "Not found", code: "NOT_FOUND" } };
  };

  const adapter: AxiosAdapter = async (config) => {
    const reply = handle(config);
    if (reply === "timeout") {
      throw new AxiosError("timeout of 15000ms exceeded", AxiosError.ECONNABORTED, config);
    }
    const response = {
      data: reply.data,
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
      request: {},
    };
    if (reply.status >= 400) {
      throw new AxiosError(`Request failed with status code ${reply.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response);
    }
    return response;
  };

  return { bank, adapter };
}
