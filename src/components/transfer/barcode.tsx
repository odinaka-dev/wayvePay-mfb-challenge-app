import { View } from "react-native";

import { palette } from "@/constants/colors";

type BarcodeProps = {
  value: string;
  height?: number;
};

/**
 * Decorative barcode derived from the value, so each receipt looks distinct.
 * It is not scannable; use a real encoder if it ever needs to be.
 */
export function Barcode({ value, height = 64 }: BarcodeProps) {
  const bars = Array.from(value).flatMap((char) => {
    const code = char.charCodeAt(0);
    return [(code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 3) % 3) + 1, 1];
  });

  return (
    <View
      className="flex-row self-center"
      style={{ height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {bars.map((width, i) => (
        <View
          key={i}
          style={{
            width: width * 1.5,
            backgroundColor: i % 2 === 0 ? palette.text : "transparent",
          }}
        />
      ))}
    </View>
  );
}
