import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, ScrollView, Text, View } from "react-native";

import { Banner } from "@/components/shared/banner";
import { Button } from "@/components/shared/button";
import { DashedDivider } from "@/components/shared/dashed-divider";
import { Icon } from "@/components/shared/icon";
import { Loader } from "@/components/shared/loader";
import { Screen } from "@/components/shared/screen";
import { TRANSACTION_STATUS_META } from "@/components/shared/status-badge";
import { StatusView } from "@/components/shared/status-view";
import { palette } from "@/constants/colors";
import { useTransactionDetails } from "@/hooks/use-transaction-details";
import { getErrorMessage, isNotFoundError } from "@/lib/errors";
import { formatDate, formatTime, maskAccountNumber } from "@/lib/format";
import { formatMinor } from "@/lib/money";
import type { transactionStatus, transactionType } from "@/types/api";

const HEADINGS: Record<transactionType, Record<transactionStatus, string>> = {
  debit: {
    successful: "Payment Successful",
    pending: "Payment Processing",
    failed: "Payment Failed",
    reversed: "Payment Reversed",
  },
  credit: {
    successful: "Money Received",
    pending: "Incoming Payment Processing",
    failed: "Incoming Payment Failed",
    reversed: "Incoming Payment Reversed",
  },
};

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="min-h-11 flex-row items-center justify-between gap-6 py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <View className="shrink flex-row items-center justify-end gap-1.5">{children}</View>
    </View>
  );
}

function Value({ children, className = "text-text" }: { children: ReactNode; className?: string }) {
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" className={`shrink text-sm ${className}`}>
      {children}
    </Text>
  );
}

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, error, isError, isRefetchError, isPlaceholderData, refetch } =
    useTransactionDetails(id);
  const [copied, setCopied] = useState(false);

  // Notice when the status changes while the screen is open (e.g. pending -> successful).
  const previousStatus = useRef<transactionStatus | undefined>(undefined);
  const [statusChange, setStatusChange] = useState<transactionStatus | null>(null);
  const status = isPlaceholderData ? undefined : transaction?.status;
  useEffect(() => {
    if (!status) return;
    if (previousStatus.current && previousStatus.current !== status) {
      setStatusChange(status);
      AccessibilityInfo.announceForAccessibility(
        `Transaction status updated to ${TRANSACTION_STATUS_META[status].label}`,
      );
    }
    previousStatus.current = status;
  }, [status]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/transactions"));

  if (isError && !transaction) {
    const notFound = isNotFoundError(error);
    return (
      <StatusView
        icon="warning"
        iconColor={notFound ? palette.warning : palette.danger}
        title={notFound ? "Transaction not found" : "Couldn't load transaction"}
        message={
          notFound
            ? "This transaction doesn't exist or is no longer available."
            : getErrorMessage(error)
        }
        actionLabel={notFound ? "Back to transactions" : "Try again"}
        onAction={notFound ? close : () => refetch()}
        onBack={close}
      />
    );
  }

  if (!transaction) {
    return (
      <Screen>
        <Loader fullScreen size="large" label="Loading transaction" />
      </Screen>
    );
  }

  const meta = TRANSACTION_STATUS_META[transaction.status];
  const isDebit = transaction.type === "debit";
  const fee = transaction.feeMinor;
  const total = isDebit ? transaction.amountMinor + (fee ?? 0) : transaction.amountMinor;
  // Failed and reversed totals didn't (or no longer) move money.
  const settledAway = transaction.status === "failed" || transaction.status === "reversed";
  const recipient = transaction.recipient;
  const subtitle = isDebit
    ? recipient &&
      ["To", recipient.bankName, recipient.accountNumber && maskAccountNumber(recipient.accountNumber)]
        .filter(Boolean)
        .join(" ")
    : transaction.sender && `From ${transaction.sender.name}`;

  const copyReference = async () => {
    await Clipboard.setStringAsync(transaction.reference);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility("Reference copied");
  };

  return (
    <Screen>
      <View className="h-14 justify-center px-5">
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-11 w-11 justify-center active:opacity-60"
        >
          <Icon name="close" size={20} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-6 pb-6">
        {statusChange ? (
          <Banner
            tone="info"
            className="mb-4"
            message={`Status updated: ${TRANSACTION_STATUS_META[statusChange].label}`}
          />
        ) : null}
        {isRefetchError ? (
          <Banner
            className="mb-4"
            message="Couldn't check for updates. The details below may be out of date."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : null}

        {/* Status badge */}
        <View className="items-center" accessible accessibilityLabel={`${HEADINGS[transaction.type][transaction.status]}. ${meta.description}`}>
          <View className={`h-28 w-28 items-center justify-center rounded-full ${meta.bgClassName}`}>
            <View
              className="h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: meta.color }}
            >
              <Icon
                name={transaction.status === "successful" ? "check" : meta.icon}
                size={36}
                color={palette.white}
              />
            </View>
          </View>
          <Text className="mt-6 text-center text-xl font-semibold text-text">
            {HEADINGS[transaction.type][transaction.status]}
          </Text>
          {subtitle ? <Text className="mt-1.5 text-center text-xs text-muted">{subtitle}</Text> : null}
          {transaction.status !== "successful" ? (
            <Text className={`mt-3 text-center text-sm ${meta.textClassName}`}>
              {meta.description}
              {transaction.status === "pending" ? " This page updates automatically." : ""}
            </Text>
          ) : null}
        </View>

        <DashedDivider className="my-6" />

        <Text accessibilityRole="header" className="mb-2 text-base font-semibold text-text">
          Transaction details
        </Text>

        <DetailRow label="Status">
          <Value className={`font-medium ${meta.textClassName}`}>{meta.label}</Value>
          <Icon name={meta.icon} size={16} color={meta.color} />
        </DetailRow>
        <DetailRow label="Type">
          <Value>{isDebit ? "Debit (money out)" : "Credit (money in)"}</Value>
        </DetailRow>
        {isDebit && recipient ? (
          <DetailRow label="Sent to">
            <Value>{recipient.name}</Value>
          </DetailRow>
        ) : null}
        {!isDebit && transaction.sender ? (
          <DetailRow label="Received from">
            <Value>{transaction.sender.name}</Value>
          </DetailRow>
        ) : null}
        {transaction.description ? (
          <DetailRow label="Description">
            <Value>{transaction.description}</Value>
          </DetailRow>
        ) : null}
        <DetailRow label="Time">
          <Value>{formatTime(transaction.createdAt)}</Value>
        </DetailRow>
        <DetailRow label="Date">
          <Value>{formatDate(transaction.createdAt)}</Value>
        </DetailRow>
        <DetailRow label="Reference">
          <Value>{transaction.reference}</Value>
          <Pressable
            onPress={copyReference}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Copy reference"
            className="active:opacity-60"
          >
            <Icon
              name={copied ? "check" : "copy"}
              size={16}
              color={copied ? palette.success : palette.muted}
            />
          </Pressable>
        </DetailRow>

        <DashedDivider className="my-4" />

        <DetailRow label="Amount">
          <Value>
            {formatMinor(transaction.amountMinor)} {transaction.currency}
          </Value>
        </DetailRow>
        {fee !== undefined ? (
          <DetailRow label="Fee">
            {fee > 0 ? (
              <Value>{formatMinor(fee)}</Value>
            ) : (
              <Value className="font-medium text-success">Free</Value>
            )}
          </DetailRow>
        ) : null}

        <DashedDivider className="my-4" />

        <DetailRow label={isDebit ? "Total debit" : "Total received"}>
          <Text
            className={`text-base font-semibold ${settledAway ? "text-muted line-through" : "text-text"}`}
          >
            {formatMinor(total)}
          </Text>
        </DetailRow>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <Button title="Done" onPress={close} />
      </View>
    </Screen>
  );
}
