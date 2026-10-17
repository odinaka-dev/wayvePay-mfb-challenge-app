import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon, type IconName } from "./icon";

type BannerTone = "error" | "warning" | "info";

const TONES: Record<BannerTone, { container: string; text: string; icon: IconName; color: string }> = {
  error: { container: "bg-red-50 border-red-200", text: "text-danger", icon: "warning", color: palette.danger },
  warning: { container: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: "warning", color: palette.warning },
  info: { container: "bg-primary/5 border-primary/20", text: "text-primary", icon: "clock", color: palette.primary },
};

type BannerProps = {
  message: string;
  tone?: BannerTone;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** Inline, non-blocking status message, e.g. "Couldn't refresh" above data that is still valid. */
export function Banner({ message, tone = "error", actionLabel, onAction, className = "" }: BannerProps) {
  const t = TONES[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${t.container} ${className}`}
    >
      <Icon name={t.icon} size={16} color={t.color} />
      <Text className={`flex-1 text-sm ${t.text}`}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className={`text-sm font-semibold ${t.text}`}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
