import { AxiosError, AxiosHeaders } from "axios";

import {
  PENDING_TRANSFER_KEY,
  createTransferCoordinator,
  type TransferApi,
} from "@/lib/transfer-coordinator";
import { memoryStorage } from "@/test/fixtures";
import type { transferParams, transferStatusParams } from "@/types/api";

const request = {
  recipientBankCode: "000001",
  recipientAccountNumber: "0123456789",
  amountMinor: 100_000,
  narration: "Rent",
};
const display = { recipientName: "Demo Recipient", bankName: "Access Bank" };

function transfer(overrides: Partial<transferStatusParams> = {}): transferStatusParams {
  return {
    transactionId: "txn_1",
    reference: "WAYVE-1",
    status: "pending",
    amountMinor: 100_000,
    currency: "NGN",
    recipientBankCode: "000001",
    recipientAccountNumber: "0123456789",
    recipientName: "Demo Recipient",
    feeMinor: 2500,
    totalDebitMinor: 102_500,
    narration: "Rent",
    createdAt: "2026-10-17T10:00:00.000Z",
    updatedAt: "2026-10-17T10:00:00.000Z",
    ...overrides,
  };
}

const timeout = () =>
  new AxiosError("timeout", AxiosError.ECONNABORTED, { headers: new AxiosHeaders() });

function httpError(status: number, code?: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("failed", "ERR_BAD_REQUEST", config, {}, {
    status,
    statusText: "",
    data: { code },
    headers: {},
    config,
  });
}

function setup(api: Partial<Record<keyof TransferApi, jest.Mock>> = {}, storage = memoryStorage()) {
  const createTransfer = api.createTransfer ?? jest.fn(async () => transfer());
  const getTransferStatus = api.getTransferStatus ?? jest.fn(async () => transfer());
  const coordinator = createTransferCoordinator({
    storage,
    api: { createTransfer, getTransferStatus },
  });
  return { coordinator, storage, createTransfer, getTransferStatus };
}

const keysSent = (mock: jest.Mock) => mock.mock.calls.map(([p]: [transferParams]) => p.idempotencyKey);

describe("transfer coordinator", () => {
  it("sends the transfer with its idempotency key and tracks it while pending", async () => {
    const { coordinator, storage, createTransfer } = setup();
    await coordinator.load();

    const outcome = await coordinator.submit(request, "key-1", display);

    expect(outcome).toEqual({ kind: "accepted", transfer: transfer() });
    expect(createTransfer).toHaveBeenCalledWith({ ...request, idempotencyKey: "key-1" });
    expect(coordinator.getState().pending).toMatchObject({ idempotencyKey: "key-1", transactionId: "txn_1" });
    expect(storage.data.has(PENDING_TRANSFER_KEY)).toBe(true);
  });

  it("persists the request before sending it (write-ahead)", async () => {
    const storage = memoryStorage();
    let savedBeforeSend = false;
    const createTransfer = jest.fn(async () => {
      savedBeforeSend = storage.data.has(PENDING_TRANSFER_KEY);
      return transfer();
    });
    const { coordinator } = setup({ createTransfer }, storage);
    await coordinator.load();

    await coordinator.submit(request, "key-1", display);

    expect(savedBeforeSend).toBe(true);
  });

  it("forgets the transfer once it is final", async () => {
    const { coordinator, storage } = setup({
      createTransfer: jest.fn(async () => transfer({ status: "successful" })),
    });
    await coordinator.load();

    await coordinator.submit(request, "key-1", display);

    expect(coordinator.getState().pending).toBeNull();
    expect(storage.data.has(PENDING_TRANSFER_KEY)).toBe(false);
  });

  describe("submission locking", () => {
    it("sends one request for concurrent submissions (double tap)", async () => {
      let resolve!: (t: transferStatusParams) => void;
      const createTransfer = jest.fn(() => new Promise<transferStatusParams>((r) => (resolve = r)));
      const { coordinator } = setup({ createTransfer });
      await coordinator.load();

      const first = coordinator.submit(request, "key-1", display);
      const second = coordinator.submit(request, "key-1", display);
      expect(coordinator.getState().busy).toBe(true);
      await Promise.resolve();
      await Promise.resolve();
      resolve(transfer());

      expect(await first).toEqual(await second);
      expect(createTransfer).toHaveBeenCalledTimes(1);
      expect(coordinator.getState().busy).toBe(false);
    });

    it("blocks a different transfer while one is unresolved", async () => {
      const { coordinator, createTransfer } = setup({ createTransfer: jest.fn(async () => Promise.reject(timeout())) });
      await coordinator.load();
      await coordinator.submit(request, "key-1", display);

      const outcome = await coordinator.submit({ ...request, amountMinor: 5 }, "key-2", display);

      expect(outcome.kind).toBe("blocked");
      expect(keysSent(createTransfer)).toEqual(["key-1"]);
    });
  });

  describe("unknown outcomes (Scenario 3)", () => {
    it("keeps the record after a timeout and verifies with the same key", async () => {
      const createTransfer = jest
        .fn()
        .mockRejectedValueOnce(timeout())
        .mockResolvedValueOnce(transfer({ status: "successful" }));
      const { coordinator } = setup({ createTransfer });
      await coordinator.load();

      const first = await coordinator.submit(request, "key-1", display);
      expect(first.kind).toBe("unknown");
      expect(coordinator.getState().pending?.idempotencyKey).toBe("key-1");

      const verified = await coordinator.verify();

      expect(verified.kind).toBe("accepted");
      // The verification re-sent the stored request with the original key, never a new one.
      expect(keysSent(createTransfer)).toEqual(["key-1", "key-1"]);
      expect(createTransfer.mock.calls[1][0]).toEqual({ ...request, idempotencyKey: "key-1" });
      expect(coordinator.getState().pending).toBeNull();
    });

    it("re-submitting the same intent verifies instead of creating a new transfer", async () => {
      const createTransfer = jest.fn().mockRejectedValueOnce(timeout()).mockResolvedValueOnce(transfer());
      const { coordinator } = setup({ createTransfer });
      await coordinator.load();

      await coordinator.submit(request, "key-1", display);
      await coordinator.submit(request, "key-1", display);

      expect(keysSent(createTransfer)).toEqual(["key-1", "key-1"]);
    });

    it.each([
      ["a 500", () => httpError(500)],
      ["a 409 conflict", () => httpError(409)],
      ["a malformed response", () => new Error("unreadable")],
    ])("treats %s as unknown", async (_, makeError) => {
      const { coordinator } = setup({ createTransfer: jest.fn(async () => Promise.reject(makeError())) });
      await coordinator.load();

      expect((await coordinator.submit(request, "key-1", display)).kind).toBe("unknown");
      expect(coordinator.getState().pending).not.toBeNull();
    });

    it("polls status by id once the transaction id is known", async () => {
      const getTransferStatus = jest.fn(async () => transfer({ status: "successful" }));
      const { coordinator, createTransfer } = setup({ getTransferStatus });
      await coordinator.load();
      await coordinator.submit(request, "key-1", display);

      const outcome = await coordinator.verify();

      expect(outcome.kind).toBe("accepted");
      expect(getTransferStatus).toHaveBeenCalledWith("txn_1");
      expect(createTransfer).toHaveBeenCalledTimes(1);
    });

    it("does not settle on an auth failure during verification", async () => {
      const createTransfer = jest.fn().mockRejectedValueOnce(timeout()).mockRejectedValueOnce(httpError(401));
      const { coordinator } = setup({ createTransfer });
      await coordinator.load();
      await coordinator.submit(request, "key-1", display);

      expect((await coordinator.verify()).kind).toBe("unknown");
      expect(coordinator.getState().pending).not.toBeNull();
    });
  });

  describe("definitive rejections", () => {
    it("clears the record on insufficient funds so the user can edit", async () => {
      const { coordinator, storage } = setup({
        createTransfer: jest.fn(async () => Promise.reject(httpError(422, "INSUFFICIENT_FUNDS"))),
      });
      await coordinator.load();

      const outcome = await coordinator.submit(request, "key-1", display);

      expect(outcome.kind).toBe("rejected");
      expect(coordinator.getState().pending).toBeNull();
      expect(storage.data.has(PENDING_TRANSFER_KEY)).toBe(false);
    });

    it("doesn't send anything if the record can't be saved", async () => {
      const storage = memoryStorage();
      storage.setItem = async () => {
        throw new Error("disk full");
      };
      const { coordinator, createTransfer } = setup({}, storage);
      await coordinator.load();

      expect((await coordinator.submit(request, "key-1", display)).kind).toBe("rejected");
      expect(createTransfer).not.toHaveBeenCalled();
    });
  });

  describe("app restart (Scenario 7)", () => {
    it("restores an unresolved transfer and verifies it without a new key", async () => {
      const storage = memoryStorage();
      const beforeRestart = setup({ createTransfer: jest.fn(async () => Promise.reject(timeout())) }, storage);
      await beforeRestart.coordinator.load();
      await beforeRestart.coordinator.submit(request, "key-1", display);

      // The app is killed and reopened: a brand-new coordinator over the same storage.
      const createTransfer = jest.fn(async () => transfer({ status: "successful" }));
      const afterRestart = setup({ createTransfer }, storage);
      await afterRestart.coordinator.load();

      expect(afterRestart.coordinator.getState().pending).toMatchObject({ idempotencyKey: "key-1", request });

      const outcome = await afterRestart.coordinator.verify();

      expect(outcome.kind).toBe("accepted");
      expect(keysSent(createTransfer)).toEqual(["key-1"]);
    });

    it("resumes status polling for a restored transfer that was already accepted", async () => {
      const storage = memoryStorage();
      const before = setup({}, storage);
      await before.coordinator.load();
      await before.coordinator.submit(request, "key-1", display);

      const after = setup({ getTransferStatus: jest.fn(async () => transfer({ status: "pending" })) }, storage);
      await after.coordinator.load();
      await after.coordinator.verify();

      expect(after.getTransferStatus).toHaveBeenCalledWith("txn_1");
      expect(after.createTransfer).not.toHaveBeenCalled();
      expect(after.coordinator.getState().pending?.transactionId).toBe("txn_1");
    });

    it("ignores a corrupt saved record instead of crashing", async () => {
      const storage = memoryStorage();
      storage.data.set(PENDING_TRANSFER_KEY, "{not json");
      const { coordinator } = setup({}, storage);

      await coordinator.load();

      expect(coordinator.getState()).toMatchObject({ loaded: true, pending: null });
    });
  });

  it("stops tracking when status polling elsewhere reports a final status", async () => {
    const { coordinator } = setup();
    await coordinator.load();
    await coordinator.submit(request, "key-1", display);

    await coordinator.reportStatus(transfer({ status: "failed" }));

    expect(coordinator.getState().pending).toBeNull();
  });
});
