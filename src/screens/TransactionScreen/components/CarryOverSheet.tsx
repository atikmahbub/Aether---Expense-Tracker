import BaseBottomSheet from "@trackingPortal/components/BaseBottomSheet";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export type CarryOverBreakdown = {
  /** Month the carry over came from, already formatted ("July"). */
  fromMonth: string;
  /** Month it lands in ("August"). */
  toMonth: string;
  carryIn: string;
  carryInNegative: boolean;
  income: string;
  spent: string;
  result: string;
  negative: boolean;
};

/** Explains where "Last month" comes from: the previous month's sum. */
export default function CarryOverSheet({
  visible,
  onClose,
  breakdown,
}: {
  visible: boolean;
  onClose: () => void;
  breakdown: CarryOverBreakdown;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const { fromMonth, toMonth } = breakdown;

  return (
    <BaseBottomSheet index={visible ? 0 : -1} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("carryOver.title")}</Text>
        <Text style={styles.body}>
          {t(breakdown.negative ? "carryOver.bodyNegative" : "carryOver.body", {
            amount: breakdown.result.replace("−", ""),
            from: fromMonth,
            to: toMonth,
          })}
        </Text>
        <View style={styles.card}>
          <Row
            label={t("carryOver.carriedInto", { month: fromMonth })}
            value={breakdown.carryIn}
            negative={breakdown.carryInNegative}
            styles={styles}
          />
          <Row
            label={t("carryOver.incomeIn", { month: fromMonth })}
            value={`+${breakdown.income}`}
            styles={styles}
          />
          <Row
            label={t("carryOver.spentIn", { month: fromMonth })}
            value={`−${breakdown.spent}`}
            styles={styles}
          />
          <View style={styles.divider} />
          <Row
            label={t("carryOver.carriedTo", { month: toMonth })}
            value={breakdown.result}
            negative={breakdown.negative}
            strong
            styles={styles}
          />
        </View>
        <Text style={styles.note}>{t("carryOver.note")}</Text>
      </View>
    </BaseBottomSheet>
  );
}

function Row({
  label,
  value,
  negative,
  strong,
  styles,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowLabelStrong]}>{label}</Text>
      <ScalarAmountText
        numberOfLines={1}
        style={[
          styles.rowValue,
          strong && styles.rowValueStrong,
          negative && styles.negative,
        ]}
      >
        {value}
      </ScalarAmountText>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    content: { paddingHorizontal: 22, paddingTop: 4, gap: 14 },
    title: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 18,
      lineHeight: 24,
    },
    body: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: designTokens.radius.group,
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      backgroundColor: colors.listCardBg,
    },
    row: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowLabel: {
      flex: 1,
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
    },
    rowLabelStrong: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
    },
    rowValue: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
      fontVariant: ["tabular-nums"],
    },
    rowValueStrong: {
      fontFamily: designTokens.font.display,
      fontSize: 16,
    },
    negative: { color: colors.negative },
    divider: { height: 1, backgroundColor: colors.rowDivider },
    note: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}
