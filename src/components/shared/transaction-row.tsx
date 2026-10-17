import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/colors";
import { formatTime } from "@/lib/format";
import { formatSignedMinor } from "@/lib/money";
import type { transactionParams } from "@/types/api";

import { IconBadge } from "./icon-badge";
import { StatusBadge, TRANSACTION_STATUS_META } from "./status-badge";

type TransactionRowProps = {
  item: transactionParams;
  showDivider?: boolean;
  onPress?: () => void;
};

export function TransactionRow({ item, showDivider = true, onPress }: TransactionRowProps) {
  const isDebit = item.type === "debit";
  const amount = formatSignedMinor(item.amountMinor, item.type);
  // Failed and reversed amounts didn't (or no longer) move money, so they're struck through.
  const settledAway = item.status === "failed" || item.status === "reversed";
  const time = formatTime(item.createdAt);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${item.description}, ${isDebit ? "debit" : "credit"} ${amount}, ${
        TRANSACTION_STATUS_META[item.status].label
      }, ${time}, reference ${item.reference}`}
      accessibilityHint={onPress ? "Opens transaction details" : undefined}
      className="active:opacity-70"
    >
      <View
        className={`flex-row items-center gap-4 py-3 ${showDivider ? "border-b border-border" : ""}`}
      >
        <IconBadge
          name={isDebit ? "send" : "request"}
          color={isDebit ? palette.danger : palette.success}
          bgClassName={isDebit ? "bg-red-50" : "bg-green-50"}
        />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base text-text">
            {item.description}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
            {item.reference} · {time}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text
            className={`text-base font-medium ${
              settledAway ? "text-muted line-through" : isDebit ? "text-text" : "text-success"
            }`}
          >
            {amount}
          </Text>
          {item.status !== "successful" ? <StatusBadge status={item.status} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
