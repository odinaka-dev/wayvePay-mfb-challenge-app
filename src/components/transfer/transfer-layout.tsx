import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/shared/icon";
import { palette } from "@/constants/colors";

type TransferLayoutProps = {
  title: string;
  children: ReactNode;
  /** Pinned under the scroll area, e.g. the primary action button. */
  footer?: ReactNode;
};

/** Primary header with a back arrow over a rounded white sheet, as in the transfer designs. */
export function TransferLayout({ title, children, footer }: TransferLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <View
        className="flex-row items-center px-6 pb-8"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 active:opacity-60"
        >
          <Icon name="back" size={20} color={palette.white} />
        </Pressable>
        <Text className="flex-1 text-center text-2xl font-bold text-white">
          {title}
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 overflow-hidden rounded-t-[32px] bg-surface">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-6 pb-6 pt-7"
        >
          {children}
        </ScrollView>
        {footer ? (
          <View
            className="px-6 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
