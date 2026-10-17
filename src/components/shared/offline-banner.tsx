import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsOnline } from "@/providers/query-app-state";

/** App-wide strip shown while the device has no connection. */
export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="absolute left-0 right-0 top-0 z-50 bg-text px-4 pb-2"
      style={{ paddingTop: insets.top + 4 }}
    >
      <Text className="text-center text-sm font-medium text-white">
        {"You're offline. Showing saved data; we'll refresh when you're back online."}
      </Text>
    </View>
  );
}
