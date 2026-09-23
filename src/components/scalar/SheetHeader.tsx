import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

export default function SheetHeader({
  title,
  action,
  onAction,
  right,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.sheetText }]}>{title}</Text>
      {right}
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.textMuted }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  title: { fontFamily: designTokens.font.semibold, fontSize: 18, lineHeight: 24 },
  action: { fontFamily: designTokens.font.medium, fontSize: 13 },
});
