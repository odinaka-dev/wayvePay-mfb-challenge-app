import { useEffect, useState } from "react";
import { Animated, type DimensionValue } from "react-native";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  className?: string;
};

/** Pulsing placeholder block shown while content loads. Hidden from screen readers. */
export function Skeleton({ width = "100%", height = 16, className = "" }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className={`rounded-lg bg-gray-200 ${className}`}
      style={{ width, height, opacity }}
    />
  );
}
