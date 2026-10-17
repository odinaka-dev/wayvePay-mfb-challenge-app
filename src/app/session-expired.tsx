import { router } from "expo-router";

import { StatusView } from "@/components/shared/status-view";
import { palette } from "@/constants/colors";
import { resetSession } from "@/lib/session";

export default function SessionExpiredScreen() {
  return (
    <StatusView
      icon="lock"
      iconColor={palette.primary}
      title="Session expired"
      message="For your security we've signed you out and cleared your account details from this device. Sign in again to continue."
      actionLabel="Sign in again"
      onAction={() => {
        // The mock API has no login, so "signing in" just starts a fresh session.
        resetSession();
        router.replace("/home");
      }}
    />
  );
}
