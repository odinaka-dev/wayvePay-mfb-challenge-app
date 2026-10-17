import "../../styles/global.css";

import {
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { AnimatedSplashOverlay } from "@/components/shared/animated-icon";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { StatusView } from "@/components/shared/status-view";
import { palette } from "@/constants/colors";
import QueryAppState from "@/providers/query-app-state";
import { PendingTransferProvider } from "@/providers/pending-transfer-provider";
import QueryProvider from "@/providers/query-provider";
import { SessionGuard } from "@/providers/session-guard";

SplashScreen.preventAutoHideAsync();

// Light mode only for now.
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primary,
    background: palette.surface,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <QueryProvider>
        <PendingTransferProvider>
          <QueryAppState />
          <SessionGuard />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="transfer" />
            <Stack.Screen
              name="transaction/[id]"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="session-expired"
              options={{ gestureEnabled: false, animation: "fade" }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <OfflineBanner />
          <AnimatedSplashOverlay />
        </PendingTransferProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// Shown by Expo Router when any route throws during render.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <StatusView
      icon="warning"
      iconColor={palette.warning}
      title="Something went wrong"
      message={
        error.message || "An unexpected error occurred. Please try again."
      }
      actionLabel="Try Again"
      onAction={retry}
    />
  );
}
