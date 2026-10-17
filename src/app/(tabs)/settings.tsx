import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import { Card } from "@/components/shared/card";
import { Header } from "@/components/shared/header";
import { Icon } from "@/components/shared/icon";
import { ListRow } from "@/components/shared/list-row";
import { Screen } from "@/components/shared/screen";
import { palette } from "@/constants/colors";
import { initials, ITEMS } from "@/constants/helpers";
import { useAccount } from "@/hooks/use-account";

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(false);
  const { data: account } = useAccount();
  const name = account?.accountName ?? "";

  return (
    <Screen backgroundColor={palette.background} edges={["top"]}>
      <Header title="My Profile" onBack={() => router.navigate("/home")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 px-4 pb-8"
      >
        {/* Profile card */}
        <Card className="items-center py-6">
          <Pressable
            hitSlop={8}
            accessibilityLabel="Edit profile"
            className="absolute right-4 top-4 active:opacity-60"
          >
            <Icon name="edit" size={18} color={palette.muted} />
          </Pressable>
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Text className="text-2xl font-bold text-white">
              {initials(name)}
            </Text>
          </View>
          <Text className="mt-3 text-lg font-semibold text-text">
            {name}
          </Text>
          <Text className="mt-1 text-sm text-muted">{account ? `Account ${account.accountNumber}` : ""}</Text>
                  </Card>

        {/* Settings list */}
        <Card className="py-1">
          <ListRow
            label="Dark Mode"
            icon="moon"
            iconColor={palette.text}
            iconBgClassName="bg-gray-300"
            showChevron={false}
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ true: palette.primary, false: palette.border }}
              />
            }
          />
          {ITEMS.map((item) => (
            <ListRow
              key={item.id}
              label={item.label}
              icon={item.icon}
              iconColor={item.color}
              iconBgClassName={item.bgClassName}
              onPress={() => {}}
            />
          ))}
          <ListRow
            label="Log Out"
            icon="logout"
            iconColor={palette.danger}
            iconBgClassName="bg-red-100"
            labelClassName="text-danger"
            showChevron={false}
            showDivider={false}
            onPress={() => {
              // Drop cached balances and transactions before leaving.
              queryClient.clear();
              router.replace("/onboarding");
            }}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
