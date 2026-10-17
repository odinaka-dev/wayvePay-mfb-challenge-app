import { Pressable, Text, View } from "react-native";

import type { BankParams } from "@/types/api";
import { Avatar } from "@/components/shared/avatar";

type BankGridProps = {
  banks: BankParams[];
  value?: string;
  onChange: (bank: BankParams) => void;
  error?: string;
};

export function BankGrid({ banks, value, onChange, error }: BankGridProps) {
  return (
    <View>
      <View className="-mx-1 flex-row flex-wrap">
        {banks.map((bank) => {
          const selected = bank.bankCode === value;
          return (
            <Pressable
              key={bank.bankCode}
              onPress={() => onChange(bank)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={bank.bankName}
              className="mb-4 w-1/4 items-center px-1 active:opacity-70"
            >
              <View
                className={`rounded-full border-2 p-0.5 ${selected ? "border-primary" : "border-transparent"}`}
              >
                <Avatar name={bank.bankName} size={56} />
              </View>
              <Text
                numberOfLines={1}
                className={`mt-2 text-sm ${selected ? "font-semibold text-primary" : "text-text"}`}
              >
                {bank.bankName}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
