import { router } from "expo-router";

import { StatusView } from "@/components/shared/status-view";
import { palette } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <StatusView
      icon="warning"
      iconColor={palette.warning}
      title={"Error 404\nPage Not Found"}
      message="Oops! It looks like the page you're looking for doesn't exist or has been moved. Please try again or go back to the home page."
      actionLabel="Back to Home"
      onAction={() => router.replace("/home")}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
