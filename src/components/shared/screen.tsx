import type { ReactNode } from "react";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { palette } from "@/constants/colors";

type ScreenProps = {
  children: ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
};

/** Safe-area aware screen container. */
export function Screen({ children, backgroundColor = palette.surface, edges = ["top", "bottom"] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor }}>
      {children}
    </SafeAreaView>
  );
}
