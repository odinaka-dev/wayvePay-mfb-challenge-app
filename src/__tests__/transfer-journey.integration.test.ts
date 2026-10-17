/**
 * Integration: the real service layer (axios client, interceptors, zod parsing,
 * idempotency header) and the transfer coordinator, against the in-memory mock bank.
 */
import { calculateTotalDebit, parseAmountToMinor } from "@/lib/money";
import { onSessionExpired, resetSession } from "@/lib/session";
import { transferSchema } from "@/lib/schema";
import { createTransferCoordinator } from "@/lib/transfer-coordinator";
import { apiClient } from "@/services/api-client";
import {
  getTransferStatus,
  getUserDetails,
  resolveAccount,
  transferServices,
} from "@/services/app.service";
import { memoryStorage } from "@/test/fixtures";
import { createMockBank, FEE_MINOR } from "@/test/mock-bank";

function setup() {
  const { bank, adapter } = createMockBank();
  apiClient.defaults.adapter = adapter;
  const storage = memoryStorage();
  const coordinator = createTransferCoordinator({
    storage,
    api: { createTransfer: transferServices, getTransferStatus },
  });
  return { bank, storage, coordinator };
}

afterEach(() => resetSession());

describe("transfer journey", () => {
  it("validates, resolves, reviews, sends, then tracks a transfer to success", async () => {
    const { bank, coordinator } = setup();
    await coordinator.load();
    const before = (await getUserDetails()).availableBalanceMinor;

    // 1-2. Form input and validation.
    const form = transferSchema.parse({
      recipientBankCode: "000001",
      recipientAccountNumber: "0123456789",
      amount: "1000.10",
      narration: "Rent",
    });
    // 3-4. Account-name enquiry.
    const recipient = await resolveAccount({
      bankCode: form.recipientBankCode,
      accountNumber: form.recipientAccountNumber,
    });
    expect(recipient.accountName).toBe("Demo Recipient");

    // 5-6. Review: amount, fee and total debit in kobo.
    const amountMinor = parseAmountToMinor(form.amount)!;
    expect(amountMinor).toBe(100_010);
    expect(calculateTotalDebit(amountMinor)).toBe(100_010 + FEE_MINOR);

    // 7. Confirm.
    const outcome = await coordinator.submit(
      { recipientBankCode: recipient.bankCode, recipientAccountNumber: recipient.accountNumber, amountMinor, narration: "Rent" },
      "key-journey",
      { recipientName: recipient.accountName, bankName: recipient.bankName },
    );
    expect(outcome.kind).toBe("accepted");
    if (outcome.kind !== "accepted") return;
    expect(outcome.transfer.status).toBe("pending");
    expect(bank.transferPosts()[0].idempotencyKey).toBe("key-journey");

    // 8-9. Result: the server settles it and status tracking picks that up.
    bank.settle(outcome.transfer.transactionId, "successful");
    const verified = await coordinator.verify();
    expect(verified.kind === "accepted" && verified.transfer.status).toBe("successful");
    expect(coordinator.getState().pending).toBeNull();

    // The client's total matches what the ledger actually debited.
    const after = (await getUserDetails()).availableBalanceMinor;
    expect(before - after).toBe(calculateTotalDebit(amountMinor));
  });

  it("recovers from a timeout after the server already processed it, debiting once (Scenario 3)", async () => {
    const { bank, coordinator } = setup();
    await coordinator.load();
    bank.nextTransfer = "timeout-after-processing";
    const before = bank.balanceMinor;

    const first = await coordinator.submit(
      { recipientBankCode: "000001", recipientAccountNumber: "0123456789", amountMinor: 50_000, narration: "Gift" },
      "key-timeout",
      { recipientName: "Demo Recipient", bankName: "Access Bank" },
    );
    expect(first.kind).toBe("unknown");

    const verified = await coordinator.verify();

    expect(verified.kind).toBe("accepted");
    expect(bank.transfersById.size).toBe(1);
    expect(bank.transferPosts().map((r) => r.idempotencyKey)).toEqual(["key-timeout", "key-timeout"]);
    expect(before - bank.balanceMinor).toBe(50_000 + FEE_MINOR);
  });

  it("surfaces insufficient funds as a definitive rejection", async () => {
    const { bank, coordinator } = setup();
    await coordinator.load();
    bank.balanceMinor = 10_000;

    const outcome = await coordinator.submit(
      { recipientBankCode: "000001", recipientAccountNumber: "0123456789", amountMinor: 10_000, narration: "x" },
      "key-poor",
      { recipientName: "Demo Recipient", bankName: "Access Bank" },
    );

    expect(outcome.kind).toBe("rejected");
    expect(bank.transfersById.size).toBe(0);
    expect(coordinator.getState().pending).toBeNull();
  });

  it("signals session expiry once for a burst of 401s, without retrying (Scenario 8)", async () => {
    const { bank } = setup();
    bank.sessionExpired = true;
    const listener = jest.fn();
    const unsubscribe = onSessionExpired(listener);

    await Promise.allSettled([getUserDetails(), getUserDetails(), getUserDetails()]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(bank.requests.filter((r) => r.url === "/account")).toHaveLength(3);
    unsubscribe();
  });

  it("rejects a malformed response at the service boundary", async () => {
    const { bank } = setup();
    apiClient.defaults.adapter = async (config) => ({
      data: { accountId: "acc_001", availableBalanceMinor: "lots" },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    await expect(getUserDetails()).rejects.toMatchObject({ name: "MalformedResponseError" });
    expect(bank.requests).toHaveLength(0);
  });
});
