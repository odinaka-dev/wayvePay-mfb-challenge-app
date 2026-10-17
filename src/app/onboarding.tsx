import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { Button } from "@/components/shared/button";
import type { IconName } from "@/components/shared/icon";
import { Illustration } from "@/components/shared/illustration";
import { PageIndicator } from "@/components/shared/page-indicator";
import { Screen } from "@/components/shared/screen";

type Slide = { id: string; icon: IconName; title: string };

const SLIDES: Slide[] = [
  { id: "manage", icon: "wallet", title: "Manage all your money in one place" },
  {
    id: "abroad",
    icon: "globe",
    title: "Spend money abroad, and track your expense",
  },
  { id: "send", icon: "bolt", title: "Send and receive money in seconds" },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = () => router.replace("/home");

  const onNext = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1 });
    setIndex(index + 1);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <Screen>
      <View className="h-12 flex-row items-center justify-end px-6">
        {!isLast && (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text className="text-sm font-medium text-muted">Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 items-center justify-center px-6"
          >
            <Illustration icon={item.icon} />
          </View>
        )}
      />

      <View className="px-6 pb-6">
        <PageIndicator count={SLIDES.length} activeIndex={index} />
        <Text className="mt-8 min-h-[108px] text-center text-3xl font-bold leading-9 text-text">
          {SLIDES[index].title}
        </Text>
        <Button
          title={isLast ? "Get Started" : "Next"}
          onPress={onNext}
          className="mt-8"
        />
      </View>
    </Screen>
  );
}
