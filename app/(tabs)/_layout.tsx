import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import type { ComponentProps } from "react";
import React from "react";

import { colors } from "@trackingPortal/themes/colors";

type MaterialCommunityIconName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

const TAB_ITEMS: {
  name: "expense" | "loan" | "investment" | "settings";
  label: string;
  icon: MaterialCommunityIconName;
}[] = [
  {
    name: "expense",
    label: "EXPENSES",
    icon: "cash",
  },
  {
    name: "loan",
    label: "LOANS",
    icon: "bank-outline",
  },
  {
    name: "investment",
    label: "INVESTMENTS",
    icon: "chart-line-variant",
  },
  {
    name: "settings",
    label: "SETTINGS",
    icon: "cog-outline",
  },
] as const;

export default function TabsLayout() {
  return (
    <NativeTabs
      iconColor={colors.subText}
      tintColor={colors.primary}
      backgroundColor={colors.surfaceAlt}
      blurEffect="systemUltraThinMaterialDark"
      shadowColor={colors.glassBorder}
    >
      {TAB_ITEMS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <Icon
            selectedColor={colors.primary}
            src={<VectorIcon family={MaterialCommunityIcons} name={tab.icon} />}
          />
          <Label
            selectedStyle={{
              color: colors.primary,
              fontWeight: "700",
              fontSize: 10,
            }}
            hidden={false}
          >
            {tab.label}
          </Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
