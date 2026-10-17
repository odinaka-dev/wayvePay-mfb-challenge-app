import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";

import { onSessionExpired } from "@/lib/session";

/**
 * Reacts to an expired session once: cancels in-flight requests, drops every cached
 * response (balances, transactions) and replaces the stack with the expired screen.
 * An unresolved transfer record is deliberately kept so it is verified after sign-in.
 */
export function SessionGuard() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.cancelQueries();
        queryClient.clear();
        if (router.canDismiss()) router.dismissAll();
        router.replace("/session-expired");
      }),
    [queryClient],
  );

  return null;
}
