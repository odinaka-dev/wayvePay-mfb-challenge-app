import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon } from "./icon";

type PinPadProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called once the last digit is entered. */
  onComplete?: (pin: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

/** PIN dots plus an on-screen number pad, so the system keyboard never shows. */
export function PinPad({
  value,
  onChange,
  onComplete,
  length = 4,
  disabled = false,
  error = false,
}: PinPadProps) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    const next = value + key;
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <View className="items-center">
      <View
        className="flex-row gap-5"
        accessibilityLabel={`${value.length} of ${length} digits entered`}
      >
        {Array.from({ length }, (_, i) => (
          <View
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              error
                ? "border-danger bg-danger"
                : i < value.length
                  ? "border-primary bg-primary"
                  : "border-border bg-transparent"
            }`}
          />
        ))}
      </View>

      <View className="mt-10 w-full flex-row flex-wrap">
        {KEYS.map((key, i) =>
          key === "" ? (
            <View key={i} className="h-20 w-1/3" />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(key)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={key === "back" ? "Delete" : key}
              className="h-20 w-1/3 items-center justify-center rounded-full active:bg-background"
            >
              {key === "back" ? (
                <Icon name="backspace" size={24} color={palette.text} />
              ) : (
                <Text className="text-3xl font-medium text-text">{key}</Text>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}
