import { useQueryClient } from "@tanstack/react-query";
import { router, usePreventRemove } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/shared/icon";
import { Loader } from "@/components/shared/loader";
import { PinPad } from "@/components/shared/pin-pad";
import { palette } from "@/constants/colors";
import { getErrorMessage } from "@/lib/errors";
import { calculateTotalDebit, formatMinor } from "@/lib/money";
import { refreshBalances, useTransferCoordinator } from "@/providers/pending-transfer-provider";
import { useIsOnline } from "@/providers/query-app-state";
import { useTransfer } from "@/providers/transfer-provider";

const PIN_LENGTH = 4;

export default function PinScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { draft, idempotencyKey, reset, renewKey } = useTransfer();
  const { coordinator, busy } = useTransferCoordinator();
  const online = useIsOnline();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Don't let the back gesture or Android back button leave mid-request.
  usePreventRemove(busy, () => {});

  if (!draft || !idempotencyKey) return null;

  const submit = async () => {
    // TODO: verify the PIN with the backend. Any 4 digits are accepted for now.
    setError(null);
    // Nothing has been sent yet, so this is a clean stop rather than an unknown outcome.
    if (!online) {
      setPin("");
      setError("You're offline. Connect to the internet to send money.");
      return;
    }
    // The coordinator is single-flight, so a second call while one is running just
    // joins it rather than sending another request.
    const outcome = await coordinator.submit(
      {
        recipientBankCode: draft.bankCode,
        recipientAccountNumber: draft.accountNumber,
        amountMinor: draft.amountMinor,
        narration: draft.narration,
      },
      idempotencyKey,
      { recipientName: draft.accountName, bankName: draft.bankName },
    );

    switch (outcome.kind) {
      case "accepted":
        queryClient.setQueryData(["transfer-status", outcome.transfer.transactionId], outcome.transfer);
        refreshBalances(queryClient);
        reset();
        router.dismissAll();
        router.replace({ pathname: "/transfer/receipt", params: { id: outcome.transfer.transactionId } });
        return;
      case "rejected":
        // The server definitely didn't create it. A fresh key means a corrected retry is a new intent.
        renewKey();
        setPin("");
        setError(getErrorMessage(outcome.error));
        return;
      case "unknown":
      case "blocked":
        // Never retry blindly: hand over to verification of the stored transfer.
        router.dismissAll();
        router.replace("/transfer/verify");
        return;
    }
  };

  return (
    <View
      className="flex-1 bg-surface px-6"
      style={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <Pressable
        onPress={() => router.back()}
        disabled={busy}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityState={{ disabled: busy }}
        className="h-11 w-11 justify-center active:opacity-60"
      >
        <Icon name="close" size={20} color={palette.text} />
      </Pressable>

      <View className="mt-4 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon name="lock" size={26} color={palette.primary} />
        </View>
        <Text className="mt-5 text-2xl font-bold text-text">Enter PIN</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-muted">
          Enter your {PIN_LENGTH}-digit PIN to send{" "}
          <Text className="font-semibold text-text">{formatMinor(draft.amountMinor)}</Text> to{" "}
          <Text className="font-semibold text-text">{draft.accountName}</Text>. Total debit{" "}
          <Text className="font-semibold text-text">
            {formatMinor(calculateTotalDebit(draft.amountMinor))}
          </Text>
          .
        </Text>
      </View>

      <View className="min-h-14 justify-center">
        {busy ? (
          <Loader label="Sending money… This can take a few seconds." />
        ) : error ? (
          <Text accessibilityRole="alert" className="text-center text-sm text-danger">
            {error}
          </Text>
        ) : null}
      </View>

      <View className="mt-auto">
        <PinPad
          value={pin}
          onChange={(value) => {
            setPin(value);
            if (error) setError(null);
          }}
          onComplete={submit}
          length={PIN_LENGTH}
          disabled={busy}
          error={!!error && !pin}
        />
      </View>
    </View>
  );
}
