import { act, waitFor } from "@testing-library/react-native";
import { AxiosError, AxiosHeaders } from "axios";

import { useTransactionHistory } from "@/hooks/use-transaction-history";
import type { TransactionFilterParams } from "@/lib/transactions";
import * as service from "@/services/app.service";
import { makeTransaction } from "@/test/fixtures";
import { deferred, renderHookWithQuery } from "@/test/render";
import type { transactionHistoryParams, transactionParams } from "@/types/api";

jest.mock("@/services/app.service", () => ({ getTransactionHistory: jest.fn() }));
const getTransactionHistory = service.getTransactionHistory as jest.MockedFunction<
  typeof service.getTransactionHistory
>;

const page = (items: transactionParams[], extra: Partial<transactionHistoryParams> = {}) => ({
  items,
  page: 1,
  limit: 20,
  total: items.length,
  hasMore: false,
  ...extra,
});

beforeEach(() => getTransactionHistory.mockReset());

describe("useTransactionHistory", () => {
  it("never lets a late response for an older search replace a newer one (Scenario 1)", async () => {
    const merchant = deferred<transactionHistoryParams>();
    const transfer = deferred<transactionHistoryParams>();
    getTransactionHistory.mockImplementation((query) =>
      query.search === "merchant" ? merchant.promise : transfer.promise,
    );

    const { result, rerender } = await renderHookWithQuery(
      (params: TransactionFilterParams) => useTransactionHistory(params),
      { initialProps: { search: "merchant" } },
    );
    await rerender({ search: "transfer" });

    // The newer search answers first...
    const transferRow = makeTransaction({ id: "t-transfer", description: "Transfer to Chidi" });
    await act(async () => transfer.resolve(page([transferRow])));
    await waitFor(() => expect(result.current.items.map((t) => t.id)).toEqual(["t-transfer"]));

    // ...then the stale one arrives and must not take over the screen.
    await act(async () => merchant.resolve(page([makeTransaction({ id: "t-merchant" })])));
    expect(result.current.items.map((t) => t.id)).toEqual(["t-transfer"]);
  });

  it("cancels the stale request via its abort signal", async () => {
    const signals: AbortSignal[] = [];
    getTransactionHistory.mockImplementation((_query, signal) => {
      if (signal) signals.push(signal);
      return new Promise(() => {});
    });

    const { rerender } = await renderHookWithQuery(
      (params: TransactionFilterParams) => useTransactionHistory(params),
      { initialProps: { search: "merchant" } },
    );
    await waitFor(() => expect(signals).toHaveLength(1));
    await rerender({ search: "transfer" });

    await waitFor(() => expect(signals[0].aborted).toBe(true));
  });

  it("restarts from page 1 when a filter changes", async () => {
    getTransactionHistory.mockImplementation(async (query) =>
      page([makeTransaction({ id: `p${query.page}` })], { page: query.page, hasMore: true }),
    );
    const { result, rerender } = await renderHookWithQuery(
      (params: TransactionFilterParams) => useTransactionHistory(params),
      { initialProps: {} },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(getTransactionHistory).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything());

    await rerender({ type: "debit" });

    await waitFor(() =>
      expect(getTransactionHistory).toHaveBeenLastCalledWith({ type: "debit", page: 1, limit: 20 }, expect.anything()),
    );
  });

  it("shows a transaction once when it appears on two pages (Scenario 2)", async () => {
    const shared = makeTransaction({ id: "shared" });
    getTransactionHistory
      .mockResolvedValueOnce(page([makeTransaction({ id: "a" }), shared], { hasMore: true }))
      .mockResolvedValueOnce(page([shared, makeTransaction({ id: "b" })], { page: 2 }));

    const { result } = await renderHookWithQuery(() => useTransactionHistory({}));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items.map((t) => t.id)).toEqual(["a", "shared", "b"]));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("keeps loaded transactions when a refresh fails (Scenario 5)", async () => {
    getTransactionHistory
      .mockResolvedValueOnce(page([makeTransaction({ id: "kept" })]))
      .mockRejectedValueOnce(new AxiosError("Network Error", "ERR_NETWORK", { headers: new AxiosHeaders() }));

    const { result } = await renderHookWithQuery(() => useTransactionHistory({}));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isRefetchError).toBe(true));
    expect(result.current.items.map((t) => t.id)).toEqual(["kept"]);
  });

  it("distinguishes an empty result from a failed request", async () => {
    getTransactionHistory.mockResolvedValueOnce(page([]));
    const empty = await renderHookWithQuery(() => useTransactionHistory({ search: "nothing" }));
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true));
    expect(empty.result.current.items).toEqual([]);
    expect(empty.result.current.isError).toBe(false);

    getTransactionHistory.mockRejectedValueOnce(new Error("boom"));
    const failed = await renderHookWithQuery(() => useTransactionHistory({ search: "fails" }));
    await waitFor(() => expect(failed.result.current.isError).toBe(true));
    expect(failed.result.current.data).toBeUndefined();
  });
});
