import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ISummary {
  investList: InvestModel[];
  status: EInvestStatus;
}

const InvestSummary: React.FC<ISummary> = ({ investList, status }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { currency } = useStoreContext();
  const isActive = status === EInvestStatus.Active;
  const totalAmount = investList.reduce((sum, item) => sum + item.amount, 0);
  const completedReturns = investList
    .filter((item) => item.earned != null && item.amount > 0)
    .map((item) => (((item.earned ?? 0) - item.amount) / item.amount) * 100);
  const averageReturn = completedReturns.length
    ? completedReturns.reduce((sum, value) => sum + value, 0) /
      completedReturns.length
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>
          {isActive ? "ACTIVE INVESTMENTS" : "COMPLETED INVESTMENTS"}
        </Text>
        <ScalarAmountText
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={styles.heroAmount}
        >
          {formatCurrency(totalAmount, currency, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </ScalarAmountText>
        <Text style={styles.heroFooter}>
          {investList.length} {investList.length === 1 ? "asset" : "assets"}
        </Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.label}>AVERAGE RETURN</Text>
          <Text
            style={[
              styles.metricValue,
              averageReturn > 0 && styles.positive,
            ]}
          >
            {formatNumber(averageReturn, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
              suffix: "%",
            })}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.label}>ASSET COUNT</Text>
          <Text style={styles.metricValue}>
            {formatNumber(investList.length, {
              maximumFractionDigits: 0,
              useGrouping: false,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default InvestSummary;

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
    metricValue: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
    positive: { color: colors.positive },
  });
}
