import { Text, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { Button } from "./button";
import { Header } from "./header";
import { Illustration } from "./illustration";
import type { IconName } from "./icon";
import { Screen } from "./screen";

type StatusViewProps = {
  icon: IconName;
  iconColor?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
  /** Pass ["top"] inside tabs, where the tab bar already handles the bottom inset. */
  edges?: Edge[];
};

/** Full-screen illustration + message + action. Used for errors, 404 and empty states. */
export function StatusView({ icon, iconColor, title, message, actionLabel, onAction, onBack, edges }: StatusViewProps) {
  return (
    <Screen edges={edges}>
      <Header onBack={onBack} />
      <View className="flex-1 items-center justify-center px-6 pb-12">
        <Illustration icon={icon} color={iconColor} />
        <Text className="mt-8 text-center text-2xl font-bold text-text">{title}</Text>
        {message ? <Text className="mt-3 text-center text-sm leading-5 text-muted">{message}</Text> : null}
        {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} className="mt-8 w-full" /> : null}
      </View>
    </Screen>
  );
}
