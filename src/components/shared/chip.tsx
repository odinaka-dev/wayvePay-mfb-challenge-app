import { Pressable, Text } from "react-native";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={`min-h-11 justify-center rounded-full border px-4 active:opacity-70 ${
        selected ? "border-primary bg-primary" : "border-border bg-surface"
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-text"}`}>{label}</Text>
    </Pressable>
  );
}
