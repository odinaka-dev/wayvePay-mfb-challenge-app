import { View } from "react-native";

type DashedDividerProps = {
  /** Tailwind background class for each dash. */
  dashClassName?: string;
  className?: string;
};

// borderStyle "dashed" on a single edge renders inconsistently on iOS, so draw the dashes.
export function DashedDivider({ dashClassName = "bg-border", className = "" }: DashedDividerProps) {
  return (
    <View className={`flex-row justify-between overflow-hidden ${className}`}>
      {Array.from({ length: 40 }, (_, i) => (
        <View key={i} className={`h-px w-1.5 ${dashClassName}`} />
      ))}
    </View>
  );
}
