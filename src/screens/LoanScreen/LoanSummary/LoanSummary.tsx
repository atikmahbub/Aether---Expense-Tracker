import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { formatCurrency } from "@trackingPortal/utils/utils";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ISummary {
  totalGiven: number;
  totalBorrowed: number;
}

const moneyOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

const LoanSummary: React.FC<ISummary> = ({
  totalGiven = 0,
  totalBorrowed = 0,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { currency } = useStoreContext();
  const netPosition = totalGiven - totalBorrowed;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>NET POSITION</Text>
        <ScalarAmountText
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={styles.heroAmount}
        >
          {formatCurrency(Math.abs(netPosition), currency, moneyOptions)}
        </ScalarAmountText>
        <Text style={styles.heroFooter}>
          {netPosition === 0
            ? "Given and borrowed are balanced"
            : netPosition > 0
              ? "More given than borrowed"
              : "More borrowed than given"}
        </Text>
      </View>
      <View style={styles.metrics}>
        <Metric
          label="TOTAL GIVEN"
          amount={`+${formatCurrency(totalGiven, currency, moneyOptions)}`}
          positive
          styles={styles}
        />
        <Metric
          label="TOTAL BORROWED"
          amount={`−${formatCurrency(totalBorrowed, currency, moneyOptions)}`}
          styles={styles}
        />
      </View>
    </View>
  );
};

function Metric({
  label,
  amount,
  positive,
  styles,
}: {
  label: string;
  amount: string;
  positive?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.label}>{label}</Text>
      <ScalarAmountText
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.metricAmount, positive && styles.positive]}
      >
        {amount}
      </ScalarAmountText>
    </View>
  );
}

export default LoanSummary;

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
    hero: {
      gap: 10,
      padding: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    label: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caps,
    },
    heroAmount: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.heroAmount,
      lineHeight: 48,
    },
    heroFooter: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontWeight: "500",
      ...designTokens.typography.caption,
    },
    metrics: { flexDirection: "row", gap: 12 },
    metricCard: {
      flex: 1,
      minWidth: 0,
      gap: 8,
      padding: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    metricAmount: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
    positive: { color: colors.positive },
  });
}
