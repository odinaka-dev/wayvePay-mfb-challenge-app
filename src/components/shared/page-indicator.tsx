import { View } from "react-native";

type PageIndicatorProps = {
  count: number;
  activeIndex: number;
};

export function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${i === activeIndex ? "w-3 bg-primary" : "w-6 bg-gray-300"}`}
        />
      ))}
    </View>
  );
}
