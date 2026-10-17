import * as Clipboard from "expo-clipboard";
import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Banner } from "@/components/shared/banner";
import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { Icon, type IconName } from "@/components/shared/icon";
import { Skeleton } from "@/components/shared/skeleton";
import { TransactionRow } from "@/components/shared/transaction-row";
import { palette } from "@/constants/colors";
import { useAccount } from "@/hooks/use-account";
import { useBalanceVisibility } from "@/hooks/use-balance-visibility";
import { useGuardedNavigation } from "@/hooks/use-guarded-navigation";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { getErrorMessage } from "@/lib/errors";
import { formatMinor } from "@/lib/money";
import { useTransferCoordinator } from "@/providers/pending-transfer-provider";

const RECENT_LIMIT = 5;
const NO_FILTERS = {};

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-11 flex-1 items-center gap-2 active:opacity-70"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon name={icon} size={24} color={palette.primary} />
      </View>
      <Text className="text-sm font-medium text-text">{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const nav = useGuardedNavigation();
  const account = useAccount();
  const recent = useTransactionHistory(NO_FILTERS, RECENT_LIMIT);
  const balance = useBalanceVisibility();
  const { pending } = useTransferCoordinator();
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const onRefresh = async () => {
    setRefreshing(true);
    // cancelRefetch: false joins a request that's already running instead of starting another.
    await Promise.all([
      account.refetch({ cancelRefetch: false }),
      recent.refetch({ cancelRefetch: false }),
    ]);
    setRefreshing(false);
  };

  const copyAccountNumber = async () => {
    if (!account.data) return;
    await Clipboard.setStringAsync(account.data.accountNumber);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility("Account number copied");
  };

  const data = account.data;
  const firstName = data?.accountName.split(" ")[0];
  const refreshFailed = (account.isRefetchError && !!data) || (recent.isRefetchError && !!recent.data);
  const recentItems = recent.items.slice(0, RECENT_LIMIT);

  return (
    <View className="flex-1 bg-background">
      {isFocused && <StatusBar style="light" />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.white}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Header + balance */}
        <View className="bg-primary px-6 pb-20" style={{ paddingTop: insets.top + 12 }}>
          {data ? (
            <View>
              <Text className="text-sm text-white/80">{greeting()},</Text>
              <Text accessibilityRole="header" className="text-xl font-semibold text-white">
                {firstName}
              </Text>
            </View>
          ) : account.isPending ? (
            <View className="gap-2">
              <Skeleton width={100} height={14} className="bg-white/30" />
              <Skeleton width={160} height={20} className="bg-white/30" />
            </View>
          ) : null}

          {account.isError && !data ? (
            <View className="mt-8 items-center gap-3">
              <Text className="text-center text-base font-semibold text-white">
                {"Couldn't load your account"}
              </Text>
              <Text className="text-center text-sm text-white/80">{getErrorMessage(account.error)}</Text>
              <Button
                title="Try again"
                variant="outline-light"
                size="sm"
                onPress={() => account.refetch()}
              />
            </View>
          ) : (
            <View className="mt-6 items-center">
              <Text className="text-sm text-white/80">Available balance</Text>
              <View className="mt-2 flex-row items-center gap-3">
                {data && balance.ready ? (
                  <Text
                    accessibilityLabel={
                      balance.hidden ? "Balance hidden" : `Balance ${formatMinor(data.availableBalanceMinor)}`
                    }
                    className="text-4xl font-bold text-white"
                  >
                    {balance.hidden ? "₦ ••••••" : formatMinor(data.availableBalanceMinor)}
                  </Text>
                ) : (
                  <Skeleton width={180} height={36} className="bg-white/30" />
                )}
                <Pressable
                  onPress={balance.toggle}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={balance.hidden ? "Show balance" : "Hide balance"}
                  className="h-11 w-11 items-center justify-center active:opacity-60"
                >
                  <Icon name={balance.hidden ? "eye" : "eyeOff"} size={20} color={palette.white} />
                </Pressable>
              </View>
              {data ? (
                <Pressable
                  onPress={copyAccountNumber}
                  accessibilityRole="button"
                  accessibilityLabel={`Account number ${data.accountNumber.split("").join(" ")}. Copy`}
                  className="mt-3 min-h-11 flex-row items-center gap-2 rounded-full bg-white/15 px-4 active:opacity-70"
                >
                  <Text className="text-sm text-white">
                    {data.currency} · {data.accountNumber}
                  </Text>
                  <Icon name={copied ? "check" : "copy"} size={14} color={palette.white} />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* Quick actions */}
        <Card className="-mt-12 mx-6 flex-row py-5">
          <QuickAction icon="send" label="Send money" onPress={() => nav.push("/transfer")} />
          <View className="w-px bg-border" />
          <QuickAction icon="transaction" label="History" onPress={() => nav.navigate("/transactions")} />
        </Card>

        <View className="mx-6 mt-4 gap-3">
          {refreshFailed ? (
            <Banner
              message="Couldn't refresh. Showing your last loaded details."
              actionLabel="Retry"
              onAction={onRefresh}
            />
          ) : null}
          {pending ? (
            <Banner
              tone="warning"
              message={`Confirming your transfer of ${formatMinor(pending.request.amountMinor)} to ${pending.recipientName}.`}
              actionLabel="View"
              onAction={() =>
                pending.transactionId
                  ? nav.push({ pathname: "/transfer/receipt", params: { id: pending.transactionId } })
                  : nav.push("/transfer/verify")
              }
            />
          ) : null}
        </View>

        {/* Recent transactions */}
        <View className="mx-6 mt-6 flex-row items-center justify-between">
          <Text accessibilityRole="header" className="text-xl font-semibold text-text">
            Recent transactions
          </Text>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="See all transactions"
            onPress={() => nav.navigate("/transactions")}
            className="min-h-11 justify-center active:opacity-60"
          >
            <Text className="text-sm font-semibold text-primary">See all</Text>
          </Pressable>
        </View>

        <Card className="mx-6 mt-3 py-1">
          {recent.isPending ? (
            <View className="gap-4 py-3" accessibilityLabel="Loading transactions">
              {Array.from({ length: 3 }, (_, i) => (
                <View key={i} className="flex-row items-center gap-4">
                  <Skeleton width={44} height={44} className="rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton width="70%" height={14} />
                    <Skeleton width="40%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : recent.isError && !recent.data ? (
            <View className="items-center gap-2 py-6">
              <Text className="text-sm text-muted">{getErrorMessage(recent.error)}</Text>
              <Button title="Try again" variant="ghost" size="sm" onPress={() => recent.refetch()} />
            </View>
          ) : recentItems.length === 0 ? (
            <Text className="py-6 text-center text-sm text-muted">
              No transactions yet. Money you send and receive will appear here.
            </Text>
          ) : (
            recentItems.map((item, i) => (
              <TransactionRow
                key={item.id}
                item={item}
                showDivider={i < recentItems.length - 1}
                onPress={() => nav.push({ pathname: "/transaction/[id]", params: { id: item.id } })}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
