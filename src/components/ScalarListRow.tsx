import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { ComponentProps, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import {
  categoryTokens,
  designTokens,
  ScalarCategoryName,
} from "@trackingPortal/themes/designTokens";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

interface ScalarListRowProps {
  title: string;
  meta: string;
  amount: string;
  icon: IconName;
  categoryName?: string;
  categoryColor?: string;
  positive?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
}

export default function ScalarListRow({
  title,
  meta,
  amount,
  icon,
  categoryName,
  categoryColor,
  positive = false,
  onPress,
  showDivider = true,
}: ScalarListRowProps) {
  const { colors, isDark } = useAppTheme();
  const palette = isDark ? categoryTokens.dark : categoryTokens.light;
  const semanticCategory = categoryName as ScalarCategoryName | undefined;
  const category = semanticCategory ? palette[semanticCategory] : undefined;
  const tileColor = category?.fill ?? categoryColor ?? colors.brand;
  const iconColor = category?.glyph ?? colors.onBrand;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.tile, { backgroundColor: tileColor }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.middle}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {meta}
        </Text>
      </View>
      <ScalarAmountText
        numberOfLines={1}
        style={[styles.amount, positive && styles.positiveAmount]}
      >
        {amount}
      </ScalarAmountText>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    pressed: {
      backgroundColor: colors.surfaceSunken,
    },
    tile: {
      width: 44,
      height: 44,
      borderRadius: designTokens.radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    middle: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontWeight: "600",
      ...designTokens.typography.rowTitle,
    },
    meta: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontWeight: "500",
      ...designTokens.typography.caption,
    },
    amount: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.rowAmount,
    },
    positiveAmount: {
      color: colors.positive,
    },
  });
}
