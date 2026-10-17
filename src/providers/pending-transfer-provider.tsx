import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

import { secureStorage } from "@/lib/storage";
import {
  createTransferCoordinator,
  type TransferCoordinator,
  type TransferOutcome,
} from "@/lib/transfer-coordinator";
import { getTransferStatus, transferServices } from "@/services/app.service";

const CoordinatorContext = createContext<TransferCoordinator | null>(null);

export function PendingTransferProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [coordinator] = useState(() =>
    createTransferCoordinator({
      storage: secureStorage,
      api: { createTransfer: transferServices, getTransferStatus },
    }),
  );

  // App start: restore a transfer that was in flight when the app closed, and check it once.
  useEffect(() => {
    let cancelled = false;
    coordinator.load().then(() => {
      if (cancelled || !coordinator.getState().pending) return;
      coordinator.verify().then((outcome) => {
        if (outcome.kind === "accepted") {
          queryClient.setQueryData(["transfer-status", outcome.transfer.transactionId], outcome.transfer);
          refreshBalances(queryClient);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [coordinator, queryClient]);

  return <CoordinatorContext value={coordinator}>{children}</CoordinatorContext>;
}

/** Balance and history change once a transfer settles. */
export function refreshBalances(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["get-user-data"] });
  queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
}

export function useTransferCoordinator() {
  const coordinator = useContext(CoordinatorContext);
  if (!coordinator) {
    throw new Error("useTransferCoordinator must be used inside PendingTransferProvider");
  }
  const state = useSyncExternalStore(coordinator.subscribe, coordinator.getState);
  return { coordinator, ...state };
}

export type { TransferOutcome };
