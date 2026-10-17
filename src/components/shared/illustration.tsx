import { View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon, type IconName } from "./icon";

type IllustrationProps = {
  icon: IconName;
  color?: string;
};

/**
 * Placeholder hero art for onboarding / empty / error states.
 * Replace with real illustration assets (e.g. expo-image) when available.
 */
export function Illustration({ icon, color = palette.primary }: IllustrationProps) {
  return (
    <View className="h-64 w-64 items-center justify-center">
      <View className="h-56 w-56 items-center justify-center rounded-full bg-primary/5">
        <View className="h-40 w-40 items-center justify-center rounded-full bg-primary/10">
          <View className="h-24 w-24 items-center justify-center rounded-3xl border border-border bg-surface">
            <Icon name={icon} size={48} color={color} />
          </View>
        </View>
      </View>
      <View className="absolute right-6 top-6">
        <Icon name="sparkle" size={18} color={palette.warning} />
      </View>
      <View className="absolute bottom-10 left-4">
        <Icon name="sparkle" size={14} color={palette.primary} />
      </View>
      <View className="absolute bottom-4 right-10">
        <Icon name="sparkle" size={12} color={palette.warning} />
      </View>
    </View>
  );
}
