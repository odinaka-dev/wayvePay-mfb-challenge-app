import { type IconName } from "@/components/shared/icon";
import { palette } from "./colors";

type SettingsItem = {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  bgClassName: string;
};

export const ITEMS: SettingsItem[] = [
  {
    id: "personal",
    label: "Personal Info",
    icon: "personFill",
    color: palette.primary,
    bgClassName: "bg-primary/10",
  },
  {
    id: "bank",
    label: "Bank & Cards",
    icon: "bank",
    color: palette.warning,
    bgClassName: "bg-amber-100",
  },
  {
    id: "transaction",
    label: "Transaction",
    icon: "transaction",
    color: palette.danger,
    bgClassName: "bg-red-100",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    color: palette.primary,
    bgClassName: "bg-primary/10",
  },
  {
    id: "privacy",
    label: "Data Privacy",
    icon: "privacy",
    color: palette.success,
    bgClassName: "bg-green-100",
  },
  {
    id: "help",
    label: "Help Center",
    icon: "help",
    color: palette.warning,
    bgClassName: "bg-amber-100",
  },
];

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
