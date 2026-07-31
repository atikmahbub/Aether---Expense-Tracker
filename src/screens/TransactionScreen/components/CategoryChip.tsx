import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import {
  categoryTokens,
  designTokens,
  ScalarCategoryName,
} from "@trackingPortal/themes/designTokens";
import { normalizeCategoryIcon } from "./../TransactionScreen.constants";

interface CategoryChipProps {
  label: string;
  color: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  color,
  icon,
  active = false,
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();
  const semantic = (isDark ? categoryTokens.dark : categoryTokens.light)[
    label as ScalarCategoryName
  ];
  const fill = semantic?.fill ?? color;
  const glyph = semantic?.glyph ?? colors.onBrand;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: active ? fill : colors.surface,
          borderColor: active ? fill : colors.border,
        },
        pressed && { backgroundColor: colors.surfaceSunken },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active ? (
        <MaterialCommunityIcons
          name={normalizeCategoryIcon(icon) as any}
          size={15}
          color={glyph}
        />
      ) : (
        <View style={[styles.swatch, { backgroundColor: fill }]} />
      )}
      <Text
        style={[
          styles.label,
          { color: active ? glyph : colors.textPrimary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: designTokens.radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1.5,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: designTokens.font.semibold,
  },
});

export default CategoryChip;
