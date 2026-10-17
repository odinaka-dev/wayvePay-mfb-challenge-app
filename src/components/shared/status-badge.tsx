import { Text, View } from "react-native";

import { palette } from "@/constants/colors";
import type { transactionStatus } from "@/types/api";

import { Icon, type IconName } from "./icon";

// One source of truth for how each status looks and reads. Reversed has its own colour and
// wording so it is never mistaken for an ordinary failure, and pending never reads as final.
export const TRANSACTION_STATUS_META: Record<
  transactionStatus,
  {
    label: string;
    description: string;
    icon: IconName;
    color: string;
    textClassName: string;
    bgClassName: string;
  }
> = {
  successful: {
    label: "Successful",
    description: "This transaction is complete.",
    icon: "checkCircle",
    color: palette.success,
    textClassName: "text-success",
    bgClassName: "bg-green-100",
  },
  pending: {
    label: "Pending",
    description: "This transaction is still processing. Its final status isn't known yet.",
    icon: "clock",
    color: palette.warning,
    textClassName: "text-amber-700",
    bgClassName: "bg-amber-100",
  },
  failed: {
    label: "Failed",
    description: "This transaction did not go through. No money left your account.",
    icon: "errorCircle",
    color: palette.danger,
    textClassName: "text-danger",
    bgClassName: "bg-red-100",
  },
  reversed: {
    label: "Reversed",
    description: "This transaction went through and was then reversed. The money was returned to your account.",
    icon: "reversed",
    color: palette.reversed,
    textClassName: "text-violet-700",
    bgClassName: "bg-violet-100",
  },
};

type StatusBadgeProps = { status: transactionStatus; className?: string };

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const meta = TRANSACTION_STATUS_META[status];
  return (
    <View
      accessibilityLabel={`Status: ${meta.label}`}
      className={`flex-row items-center gap-1 self-start rounded-full px-2 py-0.5 ${meta.bgClassName} ${className}`}
    >
      <Icon name={meta.icon} size={11} color={meta.color} />
      <Text className={`text-xs font-medium ${meta.textClassName}`}>{meta.label}</Text>
    </View>
  );
}
