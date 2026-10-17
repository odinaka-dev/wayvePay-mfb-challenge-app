import { Text, View } from "react-native";

import { initials } from "@/constants/helpers";

type AvatarProps = {
  name: string;
  size?: number;
  className?: string;
};

/** Initials in a tinted circle. Swap for a photo when the API returns one. */
export function Avatar({ name, size = 56, className = "" }: AvatarProps) {
  return (
    <View
      className={`items-center justify-center rounded-full bg-primary/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <Text
        className="font-bold text-primary"
        style={{ fontSize: size * 0.36 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
