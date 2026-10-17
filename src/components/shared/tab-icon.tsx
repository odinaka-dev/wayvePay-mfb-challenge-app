import { View } from "react-native";

import { palette } from "@/constants/colors";

import { Icon, type IconName } from "./icon";

type TabIconProps = {
  icon: IconName;
  activeIcon?: IconName;
  focused: boolean;
};

/** Bottom tab icon with an active dot underneath. */
export function TabIcon({ icon, activeIcon = icon, focused }: TabIconProps) {
  return (
    <View className="items-center gap-1">
      <Icon name={focused ? activeIcon : icon} size={22} color={focused ? palette.primary : palette.text} />
      <View className={`h-1 w-1 rounded-full ${focused ? "bg-primary" : "bg-transparent"}`} />
    </View>
  );
}

/** Raised square button for the centre tab. */
export function TabCenterIcon({ icon }: { icon: IconName }) {
  return (
    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
      <Icon name={icon} size={24} color={palette.white} />
    </View>
  );
}
