import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { CurvyHeroPanel, CustomAppBar } from "@trackingPortal/components";
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

  // "1 asset · Gold" — name the holdings while the list is short enough to read.
  const assetSubtitle = useMemo(() => {
    const count = `${investList.length} ${investList.length === 1 ? "asset" : "assets"}`;
    const names = investList
      .slice(0, 2)
      .map((item) => item.name)
      .filter(Boolean);
    if (!names.length) return count;
    const suffix = investList.length > names.length ? "…" : "";
    return `${count} · ${names.join(", ")}${suffix}`;
  }, [investList]);

  const returnIcon =
    averageReturn < 0 ? "triangle-down" : averageReturn > 0 ? "triangle" : null;
  const returnColor =
    averageReturn < 0
      ? colors.panelNegative
      : averageReturn > 0
        ? colors.panelPositive
        : colors.panelText;

  return (
    <CurvyHeroPanel>
      <CustomAppBar />
      <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>
          {isActive ? "ACTIVE INVESTMENTS" : "COMPLETED INVESTMENTS"}
        </Text>
        {/* See HomeDashboard: adjustsFontSizeToFit collapses multi-font-run
            amounts (the ৳ is Noto Sans Bengali) at this size on iOS. */}
        <ScalarAmountText numberOfLines={1} style={styles.heroAmount}>
          {formatCurrency(totalAmount, currency, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </ScalarAmountText>
        <Text style={styles.heroFooter} numberOfLines={1}>
          {assetSubtitle}
        </Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.label}>AVERAGE RETURN</Text>
          {/* Direction carries a glyph as well as the sign and colour. */}
          <View style={styles.metricValueRow}>
            {returnIcon && (
              <MaterialCommunityIcons
                name={returnIcon}
                size={13}
                color={returnColor}
              />
            )}
            <Text
              numberOfLines={1}
              style={[styles.metricValue, { color: returnColor }]}
            >
              {formatNumber(averageReturn, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
                suffix: "%",
              })}
            </Text>
          </View>
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
    </CurvyHeroPanel>
  );
};

export default InvestSummary;

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 10 },
    hero: {
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    label: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      ...designTokens.typography.caps,
    },
    heroAmount: {
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.heroAmount,
    },
    heroFooter: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.medium,
      ...designTokens.typography.caption,
    },
    metrics: { flexDirection: "row", gap: 12 },
    metricCard: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: designTokens.radius.tile,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    metricValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
    },
    metricValue: {
      flexShrink: 1,
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
  });
}
