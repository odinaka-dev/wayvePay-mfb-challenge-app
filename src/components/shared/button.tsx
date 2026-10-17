import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

import { palette } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
};

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-primary/10",
  outline: "border border-primary bg-transparent",
  "outline-light": "border border-white bg-transparent",
  ghost: "bg-transparent",
};

const textVariants: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-primary",
  outline: "text-primary",
  "outline-light": "text-white",
  ghost: "text-primary",
};

const containerSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

const textSizes: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export function Button({
  title,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const spinnerColor = variant === "primary" || variant === "outline-light" ? palette.white : palette.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-full active:opacity-80 ${containerVariants[variant]} ${containerSizes[size]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          <Text className={`font-semibold ${textVariants[variant]} ${textSizes[size]}`}>{title}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
