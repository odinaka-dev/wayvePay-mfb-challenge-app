import type { transferParams, transferStatusParams } from "@/types/api";

import { getErrorStatus } from "./errors";
import type { KeyValueStore } from "./storage";

/**
 * Owns the lifecycle of one outgoing transfer so it is executed at most once per intent.
 *
 * 1. Before POSTing, the request and its idempotency key are persisted. From then on the
 *    app treats the transfer as "possibly sent" until the server tells it otherwise.
 * 2. Only a definitive 4xx rejection clears the record. A timeout, network error, 5xx or
 *    unreadable response means the outcome is unknown, and the record is kept.
 * 3. Verifying an unknown outcome re-sends the *stored* request with the *same* key. The
 *    server treats a repeated key as a lookup and returns the original transfer instead of
 *    debiting again. Once a transaction id is known, verification polls its status instead.
 * 4. The record survives app restarts, so reopening the app resumes verification rather
 *    than allowing a second transfer.
 *
 * All calls share one in-flight promise, so double taps, a retry button and a background
 * check can never send two requests at once.
 */

export type TransferRequest = Omit<transferParams, "idempotencyKey">;

export type PendingTransfer = {
  idempotencyKey: string;
  request: TransferRequest;
  recipientName: string;
  bankName: string;
  /** Known once the server has accepted the transfer. */
  transactionId?: string;
  createdAt: string;
};

export type TransferOutcome =
  /** The server has the transfer. Its status may still be pending. */
  | { kind: "accepted"; transfer: transferStatusParams }
  /** The server definitely did not create the transfer. Safe to edit and try again. */
  | { kind: "rejected"; error: unknown }
  /** We can't tell whether the transfer happened. Must be verified, never re-created. */
  | { kind: "unknown"; error: unknown }
  /** A different transfer is still unresolved; it has to be resolved first. */
  | { kind: "blocked"; pending: PendingTransfer };

export interface TransferApi {
  createTransfer(params: transferParams): Promise<transferStatusParams>;
  getTransferStatus(id: string): Promise<transferStatusParams>;
}

export type CoordinatorState = {
  /** False until the persisted record has been read on startup. */
  loaded: boolean;
  pending: PendingTransfer | null;
  busy: boolean;
};

export const PENDING_TRANSFER_KEY = "wayve.pending-transfer.v1";

// Statuses where the server may not have looked at the request yet, or where we can't
// tell (conflict = the same key is still being processed). Never treated as final.
const INCONCLUSIVE_STATUSES = new Set([408, 409, 425, 429]);
// During verification an auth failure says nothing about the original transfer.
const AUTH_STATUSES = new Set([401, 403]);

export function classifyTransferError(
  error: unknown,
  { verifying = false }: { verifying?: boolean } = {},
): "rejected" | "unknown" {
  const status = getErrorStatus(error);
  if (status === undefined || status >= 500) return "unknown";
  if (INCONCLUSIVE_STATUSES.has(status)) return "unknown";
  if (verifying && AUTH_STATUSES.has(status)) return "unknown";
  return status >= 400 ? "rejected" : "unknown";
}

export function isFinalStatus(status: transferStatusParams["status"]) {
  return status !== "pending";
}

export function createTransferCoordinator({
  storage,
  api,
  now = () => new Date(),
}: {
  storage: KeyValueStore;
  api: TransferApi;
  now?: () => Date;
}) {
  let state: CoordinatorState = { loaded: false, pending: null, busy: false };
  let inFlight: Promise<TransferOutcome> | null = null;
  const listeners = new Set<() => void>();

  const setState = (patch: Partial<CoordinatorState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const persist = async (pending: PendingTransfer | null) => {
    if (pending) await storage.setItem(PENDING_TRANSFER_KEY, JSON.stringify(pending));
    else await storage.removeItem(PENDING_TRANSFER_KEY);
    setState({ pending });
  };

  const singleFlight = (run: () => Promise<TransferOutcome>) => {
    if (inFlight) return inFlight;
    setState({ busy: true });
    inFlight = run().finally(() => {
      inFlight = null;
      setState({ busy: false });
    });
    return inFlight;
  };

  /** Applies a server answer: keeps tracking while pending, forgets once final. */
  const accept = async (pending: PendingTransfer, transfer: transferStatusParams) => {
    if (isFinalStatus(transfer.status)) await persist(null);
    else await persist({ ...pending, transactionId: transfer.transactionId });
    return { kind: "accepted", transfer } as const;
  };

  const send = async (pending: PendingTransfer, verifying: boolean): Promise<TransferOutcome> => {
    try {
      const transfer = await api.createTransfer({
        ...pending.request,
        idempotencyKey: pending.idempotencyKey,
      });
      return await accept(pending, transfer);
    } catch (error) {
      if (classifyTransferError(error, { verifying }) === "rejected") {
        await persist(null);
        return { kind: "rejected", error };
      }
      return { kind: "unknown", error };
    }
  };

  return {
    getState: () => state,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Restores an unresolved transfer saved before the app was closed. */
    async load() {
      if (state.loaded) return;
      let pending: PendingTransfer | null = null;
      try {
        const raw = await storage.getItem(PENDING_TRANSFER_KEY);
        pending = raw ? (JSON.parse(raw) as PendingTransfer) : null;
      } catch {
        pending = null;
      }
      setState({ loaded: true, pending });
    },

    /** Sends a new transfer. Returns "blocked" if another transfer is still unresolved. */
    submit(
      request: TransferRequest,
      idempotencyKey: string,
      display: { recipientName: string; bankName: string },
    ) {
      return singleFlight(async () => {
        const existing = state.pending;
        if (existing) {
          // Same intent (e.g. a second tap after a timeout): verify, never re-create.
          if (existing.idempotencyKey === idempotencyKey) return verifyPending(existing);
          return { kind: "blocked", pending: existing };
        }

        const pending: PendingTransfer = {
          idempotencyKey,
          request,
          ...display,
          createdAt: now().toISOString(),
        };
        try {
          // Write-ahead: if this fails we haven't sent anything, so it's a safe rejection.
          await persist(pending);
        } catch (error) {
          return { kind: "rejected", error };
        }
        return send(pending, false);
      });
    },

    /** Finds out what happened to the unresolved transfer. Never creates a new one. */
    verify() {
      return singleFlight(async () => {
        const pending = state.pending;
        if (!pending) return { kind: "unknown", error: new Error("No transfer to verify") };
        return verifyPending(pending);
      });
    },

    /** Called when status polling elsewhere (e.g. the receipt) sees a newer status. */
    async reportStatus(transfer: transferStatusParams) {
      const pending = state.pending;
      if (pending?.transactionId === transfer.transactionId && isFinalStatus(transfer.status)) {
        await persist(null);
      }
    },
  };

  async function verifyPending(pending: PendingTransfer): Promise<TransferOutcome> {
    if (pending.transactionId) {
      try {
        return await accept(pending, await api.getTransferStatus(pending.transactionId));
      } catch (error) {
        return { kind: "unknown", error };
      }
    }
    return send(pending, true);
  }
}

export type TransferCoordinator = ReturnType<typeof createTransferCoordinator>;
