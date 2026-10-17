import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";

// Tell React Query about connectivity: queries pause while offline and refetch on reconnect.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    // isInternetReachable is null while unknown; only treat an explicit false as offline.
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  }),
);

export function useIsOnline() {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
}

export default function QueryAppState() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Lets React Query refetch stale data when the app returns to the foreground.
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);

  return null;
}
