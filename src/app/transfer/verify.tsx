import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { Loader } from "@/components/shared/loader";
import { Screen } from "@/components/shared/screen";
import { palette } from "@/constants/colors";
import { getErrorMessage } from "@/lib/errors";
import { formatMinor } from "@/lib/money";
import type { TransferOutcome } from "@/lib/transfer-coordinator";
import { refreshBalances, useTransferCoordinator } from "@/providers/pending-transfer-provider";

/** Automatic re-checks after an unknown outcome: 2s, 4s, 8s. Then the user decides. */
const AUTO_CHECK_DELAYS_MS = [2000, 4000, 8000];

type Phase = "checking" | "waiting" | "rejected";

export default function VerifyTransferScreen() {
  const queryClient = useQueryClient();
  const { coordinator, pending, loaded, busy } = useTransferCoordinator();
  const [phase, setPhase] = useState<Phase>("checking");
  const [rejection, setRejection] = useState<string | null>(null);
  const attempt = useRef(0);
  // Snapshot for display, since `pending` is cleared once the transfer resolves.
  const [shown] = useState(pending);

  const handle = useCallback(
    (outcome: TransferOutcome) => {
      if (outcome.kind === "accepted") {
        queryClient.setQueryData(["transfer-status", outcome.transfer.transactionId], outcome.transfer);
        refreshBalances(queryClient);
        router.replace({ pathname: "/transfer/receipt", params: { id: outcome.transfer.transactionId } });
        return true;
      }
      if (outcome.kind === "rejected") {
        setRejection(getErrorMessage(outcome.error));
        setPhase("rejected");
        return true;
      }
      return false;
    },
    [queryClient],
  );

  const check = useCallback(async () => {
    setPhase("checking");
    const done = handle(await coordinator.verify());
    if (!done) setPhase("waiting");
    return done;
  }, [coordinator, handle]);

  // Automatic checks with backoff while the screen is open.
  useEffect(() => {
    if (!loaded || !coordinator.getState().pending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      if (cancelled) return;
      const done = await check();
      const delay = AUTO_CHECK_DELAYS_MS[attempt.current++];
      if (!done && !cancelled && delay !== undefined) timer = setTimeout(run, delay);
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loaded, coordinator, check]);

  const transfer = pending ?? shown;

  if (phase === "rejected") {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <Icon name="errorCircle" size={36} color={palette.danger} />
          </View>
          <Text className="mt-6 text-center text-2xl font-bold text-text">Transfer not sent</Text>
          <Text accessibilityRole="alert" className="mt-3 text-center text-sm leading-5 text-muted">
            {rejection} No money left your account.
          </Text>
        </View>
        <View className="gap-3 px-6 pb-4">
          <Button title="Start a new transfer" onPress={() => router.replace("/transfer")} />
          <Button title="Back to home" variant="ghost" onPress={() => router.replace("/home")} />
        </View>
      </Screen>
    );
  }

  if (loaded && !transfer) {
    // Nothing to verify (e.g. resolved in the background before this opened).
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-muted">There are no transfers waiting to be confirmed.</Text>
        </View>
        <View className="px-6 pb-4">
          <Button title="Back to home" onPress={() => router.replace("/home")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Icon name="clock" size={36} color={palette.warning} />
        </View>
        <Text accessibilityRole="header" className="mt-6 text-center text-2xl font-bold text-text">
          Confirming your transfer
        </Text>
        {transfer ? (
          <Text className="mt-3 text-center text-sm leading-5 text-muted">
            We didn&apos;t get a response in time for your transfer of{" "}
            <Text className="font-semibold text-text">{formatMinor(transfer.request.amountMinor)}</Text> to{" "}
            <Text className="font-semibold text-text">{transfer.recipientName}</Text>. We&apos;re checking
            whether it went through. It won&apos;t be sent twice.
          </Text>
        ) : null}
        <View accessibilityLiveRegion="polite" className="mt-6 min-h-14 justify-center">
          {phase === "checking" || busy ? (
            <Loader label="Checking status…" />
          ) : (
            <Text className="text-center text-sm text-muted">
              Still not confirmed. Check again, or come back later. We&apos;ll keep checking when you
              reopen the app.
            </Text>
          )}
        </View>
      </View>
      <View className="gap-3 px-6 pb-4">
        <Button title="Check again" loading={busy} onPress={() => check()} />
        <Button title="Back to home" variant="ghost" onPress={() => router.replace("/home")} />
      </View>
    </Screen>
  );
}
