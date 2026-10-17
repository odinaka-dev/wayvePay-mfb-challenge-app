import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon, type IconName } from "./icon";
import { IconBadge } from "./icon-badge";

type ListRowProps = {
  label: string;
  icon: IconName;
  iconColor: string;
  iconBgClassName: string;
  labelClassName?: string;
  /** Rendered before the chevron, e.g. an amount or a Switch. */
  right?: ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  onPress?: () => void;
};

export function ListRow({
  label,
  icon,
  iconColor,
  iconBgClassName,
  labelClassName = "text-text",
  right,
  showChevron = true,
  showDivider = true,
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className="active:opacity-70"
    >
      <View className={`flex-row items-center gap-4 py-3 ${showDivider ? "border-b border-border" : ""}`}>
        <IconBadge name={icon} color={iconColor} bgClassName={iconBgClassName} />
        <Text className={`flex-1 text-base ${labelClassName}`}>{label}</Text>
        {right}
        {showChevron && <Icon name="chevronRight" size={14} color={palette.text} />}
      </View>
    </Pressable>
  );
}
