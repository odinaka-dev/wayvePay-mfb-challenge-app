import { router } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, SectionList, Text, View } from "react-native";

import { Banner } from "@/components/shared/banner";
import { Button } from "@/components/shared/button";
import { Header } from "@/components/shared/header";
import { Loader } from "@/components/shared/loader";
import { Screen } from "@/components/shared/screen";
import { TransactionRow } from "@/components/shared/transaction-row";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { palette } from "@/constants/colors";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { getErrorMessage } from "@/lib/errors";
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  toFilterParams,
  type TransactionFilters as Filters,
} from "@/lib/transactions";

export default function TransactionsScreen() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  // Only the search text is debounced; chip filters apply immediately.
  const search = useDebouncedValue(filters.search, 350);
  const { type, status, dateRange } = filters;
  const params = useMemo(
    () => toFilterParams({ search, type, status, dateRange }),
    [search, type, status, dateRange],
  );

  const {
    sections,
    data,
    error,
    isPending,
    isError,
    isRefetchError,
    isFetchNextPageError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionHistory(params);

  const activeCount = [type !== "all", status !== "all", dateRange !== "all"].filter(Boolean).length;
  const filtered = hasActiveFilters(filters);

  // Merging patches means changing one filter never resets the others.
  const updateFilters = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }));

  const renderEmpty = () => {
    if (isPending) return <Loader fullScreen size="large" label="Loading transactions" />;
    // Failed with nothing to show: say so, rather than pretending the list is empty.
    if (isError && !data) {
      return (
        <View className="flex-1 items-center justify-center gap-3 py-16">
          <Text className="text-base font-semibold text-text">{"Couldn't load transactions"}</Text>
          <Text className="text-center text-sm text-muted">{getErrorMessage(error)}</Text>
          <Button title="Try again" size="md" className="mt-2" onPress={() => refetch()} />
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center gap-3 py-16">
        <Text className="text-base font-semibold text-text">
          {filtered ? "No matching transactions" : "No transactions yet"}
        </Text>
        <Text className="text-center text-sm text-muted">
          {filtered
            ? "Try a different search or clear your filters."
            : "Money you send and receive will appear here."}
        </Text>
        {filtered ? (
          <Button
            title="Clear filters"
            variant="outline"
            size="md"
            className="mt-2"
            onPress={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : null}
      </View>
    );
  };

  return (
    <Screen edges={["top"]} backgroundColor={palette.surface}>
      <Header title="Transactions" />
      <TransactionFilters
        value={filters}
        onChange={updateFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
        activeCount={activeCount}
      />
      {isRefetchError ? (
        <Banner
          className="mx-6 mb-2"
          message="Couldn't refresh. Showing your last loaded transactions."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : null}
      <SectionList
        className="bg-background"
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 pb-8 grow"
        // Keep long histories smooth: render in small batches and drop off-screen rows.
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        renderSectionHeader={({ section }) => (
          <View className="bg-background pb-2 pt-4">
            <Text accessibilityRole="header" className="text-sm font-semibold text-muted">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View
            className={`bg-surface px-4 ${index === 0 ? "rounded-t-2xl" : ""} ${
              index === section.data.length - 1 ? "rounded-b-2xl" : ""
            }`}
          >
            <TransactionRow
              item={item}
              showDivider={index < section.data.length - 1}
              onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: item.id } })}
            />
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Loader label="Loading more" />
          ) : isFetchNextPageError ? (
            <Button
              title="Couldn't load more. Tap to retry"
              variant="ghost"
              size="sm"
              className="mt-4"
              onPress={() => fetchNextPage()}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              refetch();
            }}
            tintColor={palette.primary}
          />
        }
      />
    </Screen>
  );
}
