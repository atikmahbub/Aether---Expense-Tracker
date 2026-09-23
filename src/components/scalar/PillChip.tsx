import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

/**
 * 34pt pill. `variant="hero"` sits on the tinted top (translucent idle state);
 * `variant="sheet"` sits on the sheet (soft sage idle state).
 */
export default function PillChip({
  label,
  active,
  onPress,
  variant = "hero",
  compact,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
  variant?: "hero" | "sheet";
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const idleBg = variant === "hero" ? colors.chipIdleBg : colors.softChipBg;
  const idleInk = variant === "hero" ? colors.chipIdleInk : colors.softChipInk;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        { backgroundColor: active ? colors.chipActiveBg : idleBg },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.label,
          compact && styles.compactLabel,
          active
            ? { color: colors.chipActiveInk, fontFamily: designTokens.font.semibold }
            : { color: idleInk },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: { paddingHorizontal: 14 },
  label: { fontSize: 14, fontFamily: designTokens.font.medium },
  compactLabel: { fontSize: 13 },
});
