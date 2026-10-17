import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { Loader } from "@/components/shared/loader";
import { StatusView } from "@/components/shared/status-view";
import { RECEIPT_STATUS, ReceiptCard } from "@/components/transfer/receipt-card";
import { palette } from "@/constants/colors";
import { useBanks } from "@/hooks/use-account";
import { getErrorMessage } from "@/lib/errors";
import { refreshBalances, useTransferCoordinator } from "@/providers/pending-transfer-provider";
import { buildReceiptHtml, buildReceiptText } from "@/lib/receipt";
import { getTransferStatus, setMockTransferStatus } from "@/services/app.service";

const POLL_INTERVAL = 3000;
const SCREEN_BG = palette.text;

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { coordinator } = useTransferCoordinator();
  const { id } = useLocalSearchParams<{ id: string }>();
  const banks = useBanks();

  const { data: transfer, isError, refetch } = useQuery({
    queryKey: ["transfer-status", id],
    queryFn: ({ signal }) => getTransferStatus(id, signal),
    enabled: !!id,
    // Keep checking until a pending transfer settles.
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? POLL_INTERVAL : false,
  });

  const status = transfer?.status;
  useEffect(() => {
    if (!transfer || transfer.status === "pending") return;
    // Final: stop tracking it as an unresolved transfer and refresh balances.
    coordinator.reportStatus(transfer);
    refreshBalances(queryClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, queryClient, coordinator]);

  const settleMock = useMutation({
    mutationFn: (next: "successful" | "failed") => setMockTransferStatus(id, next),
    onSuccess: (data) => queryClient.setQueryData(["transfer-status", id], data),
    onError: (err) => Alert.alert("Couldn't update transfer", getErrorMessage(err)),
  });

  const bankName = banks.data?.find(
    (bank) => bank.bankCode === transfer?.recipientBankCode,
  )?.bankName;

  const download = useMutation({
    mutationFn: async () => {
      if (!transfer) return;
      const { uri } = await Print.printToFileAsync({
        html: buildReceiptHtml(transfer, bankName),
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: "Save receipt",
        });
      }
    },
    onError: () => Alert.alert("Download failed", "Couldn't create the receipt PDF."),
  });

  const shareInvoice = () => {
    if (!transfer) return;
    Share.share({ message: buildReceiptText(transfer, bankName) });
  };

  if (isError && !transfer) {
    return (
      <StatusView
        icon="warning"
        iconColor={palette.danger}
        title="Couldn't load receipt"
        message="Your transfer was sent. Check your transaction history for its status."
        actionLabel="Try again"
        onAction={() => refetch()}
        onBack={() => router.navigate("/home")}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      <StatusBar style="light" />
      <View
        className="flex-row items-center px-6 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.navigate("/home")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close receipt"
          className="w-10 active:opacity-60"
        >
          <Icon name="close" size={20} color={palette.white} />
        </Pressable>
        <Text className="flex-1 text-center text-2xl font-bold text-white">
          {transfer ? RECEIPT_STATUS[transfer.status].title : ""}
        </Text>
        <View className="w-10" />
      </View>

      {!transfer ? (
        <Loader fullScreen size="large" color={palette.white} />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8 pt-4"
          >
            <ReceiptCard
              transfer={transfer}
              bankName={bankName}
              backgroundColor={SCREEN_BG}
            />

            {transfer.status === "pending" ? (
              <View className="mt-8 items-center">
                <Text className="text-center text-sm text-white/70">
                  Your transfer is being processed. This page updates automatically.
                </Text>
                {__DEV__ ? (
                  <View className="mt-4 flex-row gap-3">
                    <Button
                      title="Mark successful"
                      variant="outline-light"
                      size="sm"
                      loading={settleMock.isPending}
                      onPress={() => settleMock.mutate("successful")}
                    />
                    <Button
                      title="Mark failed"
                      variant="outline-light"
                      size="sm"
                      loading={settleMock.isPending}
                      onPress={() => settleMock.mutate("failed")}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          <View
            className="flex-row gap-4 px-5 pt-2"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Button
              title="Download"
              className="flex-1"
              loading={download.isPending}
              onPress={() => download.mutate()}
            />
            <Button
              title="Share Invoice"
              variant="outline-light"
              className="flex-1"
              onPress={shareInvoice}
            />
          </View>
        </>
      )}
    </View>
  );
}
