import { Text, View } from "react-native";

import type { transferStatus, transferStatusParams } from "@/types/api";
import { Avatar } from "@/components/shared/avatar";
import { Icon, type IconName } from "@/components/shared/icon";
import { palette } from "@/constants/colors";
import { maskAccountNumber } from "@/lib/format";
import { formatMinor } from "@/lib/money";

import { Barcode } from "./barcode";

export const RECEIPT_STATUS: Record<
  transferStatus,
  { title: string; heading: string; icon: IconName; color: string; ringClassName: string }
> = {
  successful: {
    title: "Successful",
    heading: "Transfer Money Successful",
    icon: "transaction",
    color: palette.primary,
    ringClassName: "bg-primary/10",
  },
  pending: {
    title: "Processing",
    heading: "Transfer Is Processing",
    icon: "clock",
    color: palette.warning,
    ringClassName: "bg-amber-100",
  },
  failed: {
    title: "Failed",
    heading: "Transfer Failed",
    icon: "close",
    color: palette.danger,
    ringClassName: "bg-red-100",
  },
};

const dateFormat = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const CUTOUTS = 10;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-1.5">
      <Text className="text-[15px] text-muted">{label}</Text>
      <Text numberOfLines={1} className="shrink text-[15px] text-text">
        {value}
      </Text>
    </View>
  );
}

type ReceiptCardProps = {
  transfer: transferStatusParams;
  bankName?: string;
  /** Matches the screen behind the card so the ticket cut-outs read as holes. */
  backgroundColor: string;
};

export function ReceiptCard({ transfer, bankName, backgroundColor }: ReceiptCardProps) {
  const status = RECEIPT_STATUS[transfer.status] ?? RECEIPT_STATUS.pending;

  return (
    <View className="rounded-[28px] bg-background px-5 pb-10 pt-8">
      {/* Status badge with sparkles */}
      <View className="items-center">
        <View className={`h-28 w-28 items-center justify-center rounded-full ${status.ringClassName}`}>
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: status.color }}
          >
            <Icon name={status.icon} size={32} color={palette.white} />
          </View>
        </View>
        <View className="absolute left-[22%] top-6">
          <Icon name="sparkle" size={14} color={status.color} />
        </View>
        <View className="absolute right-[22%] top-0">
          <Icon name="sparkle" size={10} color={palette.border} />
        </View>
        <View className="absolute right-[24%] top-[70px]">
          <Icon name="sparkle" size={12} color={status.color} />
        </View>
        <View className="absolute left-[27%] top-[88px]">
          <Icon name="sparkle" size={10} color={palette.border} />
        </View>
      </View>

      <Text className="mt-6 text-center text-xl font-semibold text-text">
        {status.heading}
      </Text>
      <Text className="mt-5 text-center text-xs text-muted">Amount</Text>
      <Text className="mt-1 text-center text-2xl font-bold text-text">
        {formatMinor(transfer.amountMinor)}
      </Text>

      {/* Receiver */}
      <View className="mt-6 flex-row items-center gap-4 rounded-2xl bg-surface p-3">
        <Avatar name={transfer.recipientName} size={60} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-xl font-semibold text-text">
            {transfer.recipientName}
          </Text>
          <Text className="mt-1 text-xs text-muted">Receiver</Text>
        </View>
      </View>

      {/* Dashed tear line */}
      <View className="my-6 flex-row justify-between overflow-hidden">
        {Array.from({ length: 22 }, (_, i) => (
          <View key={i} className="h-px w-2.5 bg-muted" />
        ))}
      </View>

      <Row label="Transaction Fee" value={formatMinor(transfer.feeMinor)} />
      <Row label="Total Debit" value={formatMinor(transfer.totalDebitMinor)} />
      <Row
        label="Account"
        value={[bankName, maskAccountNumber(transfer.recipientAccountNumber)]
          .filter(Boolean)
          .join(" ")}
      />
      <Row label="Transaction ID" value={transfer.reference} />
      <Row label="Date" value={dateFormat.format(new Date(transfer.createdAt))} />

      <View className="mt-6">
        <Barcode value={transfer.reference} />
      </View>

      {/* Ticket cut-outs along the bottom edge */}
      <View className="absolute -bottom-3 left-4 right-4 flex-row justify-between">
        {Array.from({ length: CUTOUTS }, (_, i) => (
          <View
            key={i}
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor }}
          />
        ))}
      </View>
    </View>
  );
}
