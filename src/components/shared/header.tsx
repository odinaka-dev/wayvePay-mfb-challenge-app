import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon } from "./icon";

type HeaderProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <View className="h-14 flex-row items-center justify-between px-4">
      <View className="w-10">
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-10 w-10 justify-center active:opacity-60"
          >
            <Icon name="back" size={18} color={palette.text} />
          </Pressable>
        )}
      </View>
      {title ? <Text className="text-lg font-semibold text-text">{title}</Text> : null}
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
