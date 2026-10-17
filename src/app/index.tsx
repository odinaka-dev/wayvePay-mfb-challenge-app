import { Redirect } from "expo-router";

// TODO: skip onboarding for returning users once auth/persistence exists.
export default function Index() {
  return <Redirect href="/onboarding" />;
}
