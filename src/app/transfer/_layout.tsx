import { Stack } from "expo-router";

import { TransferProvider } from "@/providers/transfer-provider";

export default function TransferLayout() {
  return (
    <TransferProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="pin" options={{ presentation: "modal" }} />
        <Stack.Screen name="verify" options={{ gestureEnabled: false }} />
        <Stack.Screen name="receipt" options={{ gestureEnabled: false }} />
      </Stack>
    </TransferProvider>
  );
}
