import { View } from "react-native";

import { Icon, type IconName } from "./icon";

type IconBadgeProps = {
  name: IconName;
  color: string;
  bgClassName: string;
  size?: number;
};

export function IconBadge({
  name,
  color,
  bgClassName,
  size = 44,
}: IconBadgeProps) {
  return (
    <View
      className={`items-center justify-center rounded-full ${bgClassName}`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} color={color} size={size * 0.7} />
    </View>
  );
}
