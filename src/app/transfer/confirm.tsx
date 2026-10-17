import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/shared/button";
import { Icon, type IconName } from "@/components/shared/icon";
import { TransferLayout } from "@/components/transfer/transfer-layout";
import { palette } from "@/constants/colors";
import { calculateTotalDebit, calculateTransferFee, formatMinor } from "@/lib/money";
import { useTransfer } from "@/providers/transfer-provider";

function DetailPill({ icon, value }: { icon: IconName; value: string }) {
  return (
    <View className="mt-4 h-14 flex-row items-center gap-3 rounded-full bg-background px-5">
      <Icon name={icon} size={18} color={palette.muted} />
      <Text numberOfLines={1} className="flex-1 text-base text-text">
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <Text numberOfLines={1} className="shrink text-sm text-text">
        {value}
      </Text>
    </View>
  );
}

export default function ConfirmTransferScreen() {
  const { draft } = useTransfer();

  // The draft is cleared after a successful transfer while this screen is still mounted.
  if (!draft) return null;

  const feeMinor = calculateTransferFee(draft.amountMinor);
  const totalMinor = calculateTotalDebit(draft.amountMinor);

  return (
    <TransferLayout
      title="Bank Transfer"
      footer={
        <Button title="Transfer Now" onPress={() => router.push("/transfer/pin")} />
      }
    >
      <View className="flex-row items-center gap-4">
        <Avatar name={draft.accountName} size={76} />
        <Text numberOfLines={2} className="flex-1 text-2xl font-bold text-text">
          {draft.accountName}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Change transfer details"
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className="text-xs text-muted">Change</Text>
        </Pressable>
      </View>

      <DetailPill icon="bank" value={draft.bankName} />
      <DetailPill icon="spending" value={draft.accountNumber} />

      <View className="mt-6 rounded-3xl bg-background p-5">
        <Text className="mb-3 text-lg font-semibold text-text">Send Details</Text>
        <DetailRow label="Amount" value={formatMinor(draft.amountMinor)} />
        <DetailRow label="Transfer fee" value={formatMinor(feeMinor)} />
        <DetailRow label="Narration" value={draft.narration} />
        <View className="mt-2 flex-row items-center justify-between border-t border-border pt-3">
          <Text className="text-base font-semibold text-text">Total Debit</Text>
          <Text className="text-lg font-bold text-text">{formatMinor(totalMinor)}</Text>
        </View>
      </View>
    </TransferLayout>
  );
}
