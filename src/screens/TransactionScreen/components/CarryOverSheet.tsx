import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import BaseBottomSheet from "@trackingPortal/components/BaseBottomSheet";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type CarryOverBreakdown = {
  /** The carry over itself, signed ("−৳3,000"). */
  amount: string;
  /** Unsigned amount for the overspent message. */
  overspent: string;
  negative: boolean;
  /** Month the carry over comes from ("July"). */
  fromMonth: string;
  /** Month it lands in ("August"). */
  toMonth: string;
  /** The month before fromMonth, whose own carry over fed into it ("June"). */
  carriedFromMonth: string;
  carriedIn: string;
  carriedInNegative: boolean;
  income: string;
  spent: string;
};

/** "From last month": where the carry over came from, line by line. */
export default function CarryOverSheet({
  visible,
  onClose,
  onOpenSettings,
  breakdown,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  breakdown: CarryOverBreakdown;
}) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const { fromMonth, toMonth, negative } = breakdown;

  return (
    <BaseBottomSheet index={visible ? 0 : -1} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headline}>
            <Text style={styles.eyebrow}>{t("carryOver.fromLastMonth")}</Text>
            <ScalarAmountText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.amount, negative && styles.negative]}
            >
              {breakdown.amount}
            </ScalarAmountText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("carryOver.gotIt")}
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.negative} />
          </Pressable>
        </View>

        <Text style={styles.body}>
          {negative
            ? t("carryOver.bodyNegative", {
                amount: breakdown.overspent,
                from: fromMonth,
                to: toMonth,
              })
            : t("carryOver.body", { from: fromMonth, to: toMonth })}
        </Text>

        <View style={styles.card}>
          <Row
            label={t("carryOver.carriedFrom", { month: breakdown.carriedFromMonth })}
            value={breakdown.carriedIn}
            negative={breakdown.carriedInNegative}
            styles={styles}
          />
          <Row
            label={t("carryOver.monthIncome", { month: fromMonth })}
            value={breakdown.income}
            styles={styles}
          />
          <Row
            label={t("carryOver.monthSpent", { month: fromMonth })}
            value={breakdown.spent}
            negative
            styles={styles}
          />
          <Row
            label={t("carryOver.leftAtEnd", { month: fromMonth })}
            value={breakdown.amount}
            negative={negative}
            strong
            last
            styles={styles}
          />
        </View>

        <Text style={styles.note}>{t("carryOver.note")}</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenSettings}
            style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>{t("settings.title")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>{t("carryOver.gotIt")}</Text>
          </Pressable>
        </View>
      </View>
    </BaseBottomSheet>
  );
}

function Row({
  label,
  value,
  negative,
  strong,
  last,
  styles,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
  last?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={[styles.rowLabel, strong && styles.rowLabelStrong]}>{label}</Text>
      <ScalarAmountText
        numberOfLines={1}
        style={[styles.rowValue, negative && styles.negative]}
      >
        {value}
      </ScalarAmountText>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
    content: { paddingHorizontal: 24, paddingTop: 8, gap: 18 },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    headline: { flexShrink: 1, gap: 4 },
    eyebrow: {
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 15,
      lineHeight: 20,
    },
    amount: {
      color: colors.sheetText,
      fontFamily: designTokens.font.display,
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.9,
      fontVariant: ["tabular-nums"],
    },
    negative: { color: colors.negative },
    close: {
      width: 46,
      height: 46,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? colors.negativeFill : colors.listCardBg,
      backgroundColor: colors.negativeTile,
    },
    body: {
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
      lineHeight: 26,
    },
    card: {
      overflow: "hidden",
      borderRadius: 20,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      backgroundColor: isDark ? colors.listCardBg : colors.heroGradBottom,
    },
    row: {
      minHeight: 58,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.listCardBorder },
    rowLabel: {
      flex: 1,
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
    },
    rowLabelStrong: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
    },
    rowValue: {
      color: colors.sheetText,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
    },
    note: {
      paddingHorizontal: 4,
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
      lineHeight: 21,
    },
    // Same pair as SheetConfirm.
    actions: { flexDirection: "row", gap: 12, paddingTop: 2 },
    button: {
      flex: 1,
      height: 60,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    secondary: { backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg },
    secondaryText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    primary: { backgroundColor: colors.primaryButtonBg },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    pressed: { opacity: 0.75 },
  });
}
