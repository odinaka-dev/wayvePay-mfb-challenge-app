import { Pressable, Text, TextInput, View } from "react-native";

import { Icon } from "@/components/shared/icon";
import { palette } from "@/constants/colors";
import { formatMinor, minorToAmountInput, parseAmountToMinor } from "@/lib/money";

/** ±₦1,000, in kobo. */
const STEP_MINOR = 100_000;

type AmountCardProps = {
  /** Naira as typed, e.g. "2500.50". */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  balanceMinor?: number;
  error?: string;
};

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: "minus" | "plus";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-70"
    >
      <Icon name={icon} size={18} color={palette.text} />
    </Pressable>
  );
}

/** Big centred amount with ±₦1,000 steppers. */
export function AmountCard({
  value,
  onChange,
  onBlur,
  balanceMinor,
  error,
}: AmountCardProps) {
  const step = (direction: 1 | -1) => {
    const next = Math.max(0, (parseAmountToMinor(value) ?? 0) + direction * STEP_MINOR);
    onChange(next ? minorToAmountInput(next) : "");
  };

  return (
    <View
      className={`items-center rounded-3xl border bg-background px-4 py-6 ${error ? "border-danger" : "border-transparent"}`}
    >
      <Text className="text-base font-medium text-text">Amount (NGN)</Text>
      <View className="mt-4 w-full flex-row items-center gap-2">
        <StepButton icon="minus" label="Decrease amount" onPress={() => step(-1)} />
        <View className="flex-1 flex-row items-center justify-center">
          <Text className="text-4xl font-bold text-text">₦</Text>
          <TextInput
            value={value}
            onChangeText={(text) => onChange(text.replace(/[^\d.]/g, ""))}
            onBlur={onBlur}
            placeholder="0.00"
            placeholderTextColor={palette.muted}
            keyboardType="decimal-pad"
            accessibilityLabel="Amount in naira"
            className="min-w-16 text-4xl font-bold text-text"
          />
        </View>
        <StepButton icon="plus" label="Increase amount" onPress={() => step(1)} />
      </View>
      {error ? (
        <Text className="mt-3 text-xs text-danger">{error}</Text>
      ) : balanceMinor !== undefined ? (
        <Text className="mt-3 text-sm text-muted">
          Available Balance: {formatMinor(balanceMinor)}
        </Text>
      ) : null}
    </View>
  );
}
