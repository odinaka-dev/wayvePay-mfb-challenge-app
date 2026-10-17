import { ActivityIndicator, Text, View } from "react-native";

import { palette } from "@/constants/colors";

type LoaderProps = {
  label?: string;
  size?: "small" | "large";
  color?: string;
  /** Fill the parent and center, e.g. for a first load. Defaults to an inline row. */
  fullScreen?: boolean;
  className?: string;
};

/** Spinner with an optional label. Use inline as a list footer or fullScreen for initial loads. */
export function Loader({
  label,
  size = "small",
  color = palette.primary,
  fullScreen = false,
  className = "",
}: LoaderProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? "Loading"}
      className={`items-center justify-center gap-2 ${fullScreen ? "flex-1" : "flex-row py-6"} ${className}`}
    >
      <ActivityIndicator size={size} color={color} />
      {label ? <Text className="text-sm text-muted">{label}</Text> : null}
    </View>
  );
}
