import { useState, type ReactNode, type Ref } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";

import { palette } from "@/constants/colors";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Shown under the field when there is no error. */
  hint?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  containerClassName?: string;
  ref?: Ref<TextInputInstance>;
};

export function Input({
  label,
  error,
  hint,
  left,
  right,
  containerClassName = "",
  editable = true,
  onFocus,
  onBlur,
  ref,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderClassName = error
    ? "border-danger"
    : focused
      ? "border-primary"
      : "border-transparent";

  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-text">{label}</Text>
      ) : null}
      <View
        className={`h-14 flex-row items-center gap-3 rounded-full border bg-background px-5 ${borderClassName} ${editable ? "" : "opacity-60"}`}
      >
        {left}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={palette.muted}
          accessibilityLabel={label}
          className="h-full flex-1 text-base text-text"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {right}
      </View>
      {error ? (
        <Text className="ml-5 mt-1.5 text-xs text-danger">{error}</Text>
      ) : hint ? (
        <View className="ml-5 mt-1.5">
          {typeof hint === "string" ? (
            <Text className="text-xs text-muted">{hint}</Text>
          ) : (
            hint
          )}
        </View>
      ) : null}
    </View>
  );
}
