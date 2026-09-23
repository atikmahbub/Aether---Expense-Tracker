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
  /** Glyph ink for the icon tile. Defaults to the on-brand ink. */
  iconGlyphColor?: string;
  positive?: boolean;
  negative?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
  grouped?: boolean;
  /** Small line under the amount (loan status, return %). */
  status?: string;
}

export default function ScalarListRow({
  title,
  meta,
  amount,
  icon,
  categoryName,
  categoryColor,
  iconGlyphColor,
  positive = false,
  negative = false,
  onPress,
  showDivider = true,
  grouped = false,
  status,
}: ScalarListRowProps) {
  const { colors, isDark } = useAppTheme();
  const palette = isDark ? categoryTokens.dark : categoryTokens.light;
  const semanticCategory = categoryName as ScalarCategoryName | undefined;
  const category = semanticCategory ? palette[semanticCategory] : undefined;
  const tileColor = category?.fill ?? categoryColor ?? colors.brand;
  const iconColor = category?.glyph ?? iconGlyphColor ?? colors.onBrand;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        grouped && styles.groupedRow,
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
      <View style={styles.right}>
        <ScalarAmountText
          numberOfLines={1}
          style={[styles.amount, positive && styles.positiveAmount, negative && styles.negativeAmount]}
        >
          {amount}
        </ScalarAmountText>
        {status ? (
          <Text numberOfLines={1} style={styles.status}>
            {status}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 11,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.rowDivider,
    },
    groupedRow: {
      paddingHorizontal: 14,
    },
    pressed: {
      opacity: 0.7,
    },
    tile: {
      width: 44,
      height: 44,
      borderRadius: designTokens.radius.full,
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
      ...designTokens.typography.rowTitle,
    },
    meta: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      ...designTokens.typography.caption,
    },
    amount: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.rowAmount,
    },
    right: {
      alignItems: "flex-end",
      gap: 2,
    },
    status: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    positiveAmount: {
      color: colors.positive,
    },
    negativeAmount: {
      color: colors.negative,
    },
  });
}
