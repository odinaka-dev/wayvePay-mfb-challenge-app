import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & { className?: string };

export function Card({ className = "", ...props }: CardProps) {
  return <View className={`rounded-2xl bg-surface p-4 ${className}`} {...props} />;
}
