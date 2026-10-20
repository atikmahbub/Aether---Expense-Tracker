import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface SheetConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation shown inside a bottom sheet. The app-level ScalarAlert is its
 * own Modal, and iOS can't present it over an open sheet: it stays invisible
 * while still swallowing touches, which freezes the screen. Sheets swap their
 * body for this panel instead.
 *
 * Returns `confirm(options)` and the panel to render (null when idle).
 */
export function useSheetConfirm() {
  const [pending, setPending] = useState<SheetConfirmOptions | null>(null);
  const confirm = useCallback((options: SheetConfirmOptions) => setPending(options), []);
  const cancel = useCallback(() => setPending(null), []);

  const panel = pending ? (
    <SheetConfirmPanel
      {...pending}
      onCancel={cancel}
      onConfirm={() => {
        setPending(null);
        pending.onConfirm();
      }}
    />
  ) : null;

  return { confirm, panel, cancel };
}

function SheetConfirmPanel({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: SheetConfirmOptions & { onCancel: () => void }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.button,
            destructive ? styles.destructive : styles.primary,
            pressed && styles.pressed,
          ]}
        >
          <Text style={destructive ? styles.destructiveText : styles.primaryText}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
    root: { gap: 12, paddingTop: 8, paddingBottom: 4 },
    title: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 20,
    },
    message: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    actions: { flexDirection: "row", gap: 10, paddingTop: 12 },
    button: {
      flex: 1,
      height: 54,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    secondary: { backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg },
    secondaryText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    primary: { backgroundColor: colors.primaryButtonBg },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    destructive: { backgroundColor: colors.negative },
    destructiveText: {
      color: colors.onNegative,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    pressed: { opacity: 0.75 },
  });
}
