import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  groupTransactionsByDay,
  mergeUniqueTransactions,
  type TransactionFilterParams,
} from "@/lib/transactions";
import { getTransactionHistory } from "@/services/app.service";

export const TRANSACTION_PAGE_SIZE = 20;

export const transactionHistoryKey = (params: TransactionFilterParams) =>
  ["transaction-history", params] as const;

/**
 * Paged transaction history for one combination of filters.
 *
 * Race safety: the filters are part of the query key, so every combination has its own
 * cache entry and a new key always starts again at page 1. A late response for an old
 * search can only land in the old key's cache entry, never the one on screen, and the
 * `signal` cancels the old request when its observer goes away.
 */
export function useTransactionHistory(params: TransactionFilterParams, limit = TRANSACTION_PAGE_SIZE) {
  const query = useInfiniteQuery({
    queryKey: [...transactionHistoryKey(params), limit],
    queryFn: ({ pageParam, signal }) =>
      getTransactionHistory({ ...params, page: pageParam, limit }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const items = useMemo(() => mergeUniqueTransactions(query.data?.pages ?? []), [query.data]);
  const sections = useMemo(() => groupTransactionsByDay(items), [items]);

  return { ...query, items, sections };
}
