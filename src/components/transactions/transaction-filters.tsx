import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/shared/chip";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { TRANSACTION_STATUS_META } from "@/components/shared/status-badge";
import { palette } from "@/constants/colors";
import type {
  DateRange,
  TransactionFilters as Filters,
} from "@/lib/transactions";
import { transactionStatuses } from "@/types/api";

const TYPE_OPTIONS: { value: Filters["type"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "credit", label: "Money in" },
  { value: "debit", label: "Money out" },
];

const STATUS_OPTIONS: { value: Filters["status"]; label: string }[] = [
  { value: "all", label: "Any status" },
  ...transactionStatuses.map((status) => ({
    value: status,
    label: TRANSACTION_STATUS_META[status].label,
  })),
];

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      contentContainerClassName="gap-2 px-6"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
          accessibilityLabel={`${label}: ${option.label}`}
        />
      ))}
    </ScrollView>
  );
}

type TransactionFiltersProps = {
  value: Filters;
  /** Receives a partial update; the screen merges it so filters combine instead of replacing each other. */
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  /** Number of non-default filters besides search, shown on the toggle. */
  activeCount: number;
};

export function TransactionFilters({
  value,
  onChange,
  onClear,
  activeCount,
}: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const canClear = activeCount > 0 || value.search.trim() !== "";

  return (
    <View className="gap-3 pb-2">
      <View className="flex-row items-center gap-3 px-6">
        <View className="flex-1">
          <Input
            value={value.search}
            onChangeText={(search) => onChange({ search })}
            placeholder="Search description or reference"
            accessibilityLabel="Search transactions by description or reference"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            left={<Icon name="search" size={18} color={palette.muted} />}
            right={
              value.search ? (
                <Pressable
                  onPress={() => onChange({ search: "" })}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Icon name="errorCircle" size={18} color={palette.muted} />
                </Pressable>
              ) : undefined
            }
          />
        </View>
        <Pressable
          onPress={() => setExpanded((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Filters${activeCount ? `, ${activeCount} active` : ""}`}
          className={`h-14 w-14 items-center justify-center rounded-full active:opacity-70 ${
            expanded || activeCount ? "bg-primary" : "bg-background"
          }`}
        >
          <Icon
            name="filter"
            size={20}
            color={expanded || activeCount ? palette.white : palette.text}
          />
          {activeCount ? (
            <View className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1">
              <Text className="text-[11px] font-bold text-white">
                {activeCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {expanded ? (
        <>
          <ChipRow
            label="Type"
            options={TYPE_OPTIONS}
            value={value.type}
            onChange={(type) => onChange({ type })}
          />
          <ChipRow
            label="Status"
            options={STATUS_OPTIONS}
            value={value.status}
            onChange={(status) => onChange({ status })}
          />
          <ChipRow
            label="Date range"
            options={DATE_OPTIONS}
            value={value.dateRange}
            onChange={(dateRange) => onChange({ dateRange })}
          />
        </>
      ) : null}
      {canClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          className="min-h-11 justify-center self-start px-6 active:opacity-60"
        >
          <Text className="text-sm font-semibold text-primary">
            Clear filters
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
