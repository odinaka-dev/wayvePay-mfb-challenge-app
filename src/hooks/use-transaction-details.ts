import { useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { isNotFoundError } from "@/lib/errors";
import { getTransactionDetails } from "@/services/app.service";
import type { transactionHistoryParams, transactionParams } from "@/types/api";

export const PENDING_POLL_INTERVAL = 5000;

export function useTransactionDetails(id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery<transactionParams>({
    queryKey: ["transaction-details", id],
    queryFn: ({ signal }) => getTransactionDetails(id!, signal),
    enabled: !!id,
    // A missing transaction won't appear on retry.
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 2,
    // Keep checking while the status isn't final, so a change shows up on screen.
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? PENDING_POLL_INTERVAL : false,
    // Show the row we already have from any loaded history list while the details load.
    placeholderData: (): transactionParams | undefined => {
      for (const [, data] of queryClient.getQueriesData<InfiniteData<transactionHistoryParams>>({
        queryKey: ["transaction-history"],
      })) {
        const match = data?.pages.flatMap((page) => page.items).find((item) => item.id === id);
        if (match) return match;
      }
      return undefined;
    },
  });
}
