import BaseBottomSheet from "@trackingPortal/components/BaseBottomSheet";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import SheetCloseButton from "@trackingPortal/components/scalar/SheetCloseButton";
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
    <BaseBottomSheet
      index={visible ? 0 : -1}
      onClose={onClose}
      // White paper in light mode, per the design; the usual sheet in dark.
      backgroundColor={isDark ? colors.sheet : colors.listCardBg}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headline}>
            <Text style={styles.eyebrow}>{t("carryOver.fromLastMonth")}</Text>
            <ScalarAmountText
              numberOfLines={1}
              style={[styles.amount, amountSize(breakdown.amount), negative && styles.negative]}
            >
              {breakdown.amount}
            </ScalarAmountText>
          </View>
          <SheetCloseButton
            accessibilityLabel={t("carryOver.gotIt")}
            onPress={onClose}
            style={styles.close}
          />
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

// Steps the amount down for long figures. Not adjustsFontSizeToFit: on iOS
// it miscalculates with a lineHeight set and shrinks the text to a speck.
const amountSize = (text: string) => {
  const fontSize = text.length <= 11 ? 40 : text.length <= 13 ? 34 : 28;
  return { fontSize, lineHeight: Math.round(fontSize * 1.3) };
};

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  // Slate in light, muted grey in dark, as in the design.
  const secondaryInk = isDark ? colors.textMuted : colors.textSecondary;
  return StyleSheet.create({
    // BaseBottomSheet pads 22; the design sits 20 from the edge.
    content: { marginHorizontal: -2, paddingTop: 4 },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    headline: { flexShrink: 1, gap: 4 },
    eyebrow: {
      color: secondaryInk,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
      lineHeight: 18,
    },
    amount: {
      color: colors.heroInk,
      fontFamily: designTokens.font.display,
      // Size and line height come from amountSize. Unbounded's glyphs stand
      // taller than 1.1em, so the line is 1.3em to keep clear of the label.
      letterSpacing: -0.8,
      fontVariant: ["tabular-nums"],
    },
    negative: { color: colors.negative },
    close: { marginTop: 3 },
    body: {
      marginTop: 10,
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    card: {
      marginTop: 15,
      overflow: "hidden",
      borderRadius: 18,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      backgroundColor: isDark ? colors.listCardBg : colors.sheet,
    },
    row: {
      minHeight: 50,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.listCardBorder },
    rowLabel: {
      flex: 1,
      color: secondaryInk,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
    },
    rowLabelStrong: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
    },
    rowValue: {
      color: colors.sheetText,
      fontFamily: designTokens.font.display,
      fontSize: 15,
      letterSpacing: -0.3,
      fontVariant: ["tabular-nums"],
    },
    note: {
      marginTop: 16,
      paddingHorizontal: 4,
      color: secondaryInk,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
      lineHeight: 20,
    },
    // Same pair as SheetConfirm.
    actions: { marginTop: 20, flexDirection: "row", gap: 10 },
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
    pressed: { opacity: 0.75 },
  });
}
