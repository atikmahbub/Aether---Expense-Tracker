import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MonthlyLimitModel, TransactionModel } from "@trackingPortal/api/models";
import { TransactionSummaryModel } from "@trackingPortal/api/models/TransactionSummaryModel";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { CurvyHeroPanel, CustomAppBar } from "@trackingPortal/components";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { CurrencyPreference } from "@trackingPortal/constants/currency";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import { parseDate } from "@trackingPortal/utils/date";
import dayjs, { Dayjs } from "dayjs";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface HomeDashboardProps {
  month: Dayjs;
  type: "expense" | "income";
  summary: TransactionSummaryModel | null;
  monthlyLimit: MonthlyLimitModel;
  transactions: TransactionModel[];
  currency: CurrencyPreference;
  loading?: boolean;
  ledgerControl: React.ReactNode;
  onAdjustLimit: () => void;
}

const money = (value: number, currency: CurrencyPreference) =>
  formatCurrency(value, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const signedMoney = (
  value: number,
  currency: CurrencyPreference,
  positive: boolean,
) => `${positive ? "+" : "−"}${money(Math.abs(value), currency)}`;

const compact = (value: number) => {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, {
      maximumFractionDigits: 0,
    })}k`;
  }
  return formatNumber(value, { maximumFractionDigits: 0 });
};

export default function HomeDashboard({
  month,
  type,
  summary,
  monthlyLimit,
  transactions,
  currency,
  loading,
  ledgerControl,
  onAdjustLimit,
}: HomeDashboardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [chartExpanded, setChartExpanded] = useState(false);
  const expenseTotal = summary?.totalExpense ?? 0;
  const incomeTotal = summary?.totalIncome ?? 0;
  const activeTotal = type === "expense" ? expenseTotal : incomeTotal;
  const limit = monthlyLimit?.limit ?? 0;
  const ratio = limit > 0 ? expenseTotal / limit : 0;
  const isOver = type === "expense" && ratio > 1;
  const progress = type === "expense" && limit > 0 ? Math.min(ratio, 1) : 0;
  const difference = Math.abs(expenseTotal - limit);
  const days = Math.max(month.daysInMonth(), 1);

  const weekly = useMemo(() => {
    const values = Array.from({ length: 4 }, () => ({ income: 0, expense: 0 }));
    transactions.forEach((transaction) => {
      const date = dayjs(parseDate(transaction.date));
      if (!date.isValid()) return;
      const week = Math.min(Math.floor((date.date() - 1) / 7), 3);
      values[week][transaction.type] += Math.abs(transaction.amount);
    });
    return values;
  }, [transactions]);

  const chartMax = Math.max(
    ...weekly.flatMap((week) => [week.income, week.expense]),
    1,
  );
  const axisMax = Math.ceil(chartMax / 20000) * 20000 || 20000;

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<
      string,
      { name: string; total: number; color?: string }
    >();
    transactions
      .filter((transaction) => transaction.type === type)
      .forEach((transaction) => {
        const name = transaction.category?.name || "Uncategorized";
        const current = totals.get(name);
        totals.set(name, {
          name,
          total: (current?.total || 0) + Math.abs(transaction.amount),
          color: transaction.category?.color || current?.color,
        });
      });
    return Array.from(totals.values()).sort((a, b) => b.total - a.total);
  }, [transactions, type]);

  const categoryMax = Math.max(
    ...categoryBreakdown.map((category) => category.total),
    1,
  );

  return (
    <View style={styles.container}>
      <CurvyHeroPanel>
        <CustomAppBar />
        <View style={styles.panelContent}>
          {ledgerControl}

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.capsLabel}>
            {type === "expense"
              ? `SPENT IN ${month.format("MMMM").toUpperCase()}`
              : `EARNED IN ${month.format("MMMM").toUpperCase()}`}
          </Text>
          {isOver && (
            <View style={styles.overBadge}>
              <Text style={styles.overBadgeText}>
                {formatNumber(ratio * 100, { maximumFractionDigits: 0 })}% OVER
              </Text>
            </View>
          )}
        </View>
        <ScalarAmountText
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={styles.heroAmount}
        >
          {loading ? "…" : money(activeTotal, currency)}
        </ScalarAmountText>
        {type === "expense" && (
          <>
            {limit > 0 && (
              <View style={styles.limitTrack}>
                <View
                  style={[
                    styles.limitFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isOver ? colors.negative : colors.brand,
                    },
                  ]}
                />
              </View>
            )}
            <View style={styles.limitFooter}>
              <View style={styles.limitActionGroup}>
                <ScalarAmountText style={styles.limitText}>
                  {limit > 0
                    ? `Limit ${money(limit, currency)}`
                    : "No monthly limit"}
                </ScalarAmountText>
                <Pressable
                  accessibilityRole="button"
                  onPress={onAdjustLimit}
                  style={({ pressed }) => [
                    styles.limitAction,
                    pressed && styles.limitActionPressed,
                  ]}
                >
                  <Text style={styles.limitActionText}>
                    {limit > 0 ? "Adjust limit" : "Set limit"}
                  </Text>
                </Pressable>
              </View>
              {limit > 0 && (
                <ScalarAmountText
                  style={[
                    styles.limitStatus,
                    isOver && styles.negativeText,
                  ]}
                >
                  {`${money(difference, currency)} ${isOver ? "over" : "left"}`}
                </ScalarAmountText>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.capsLabel}>
            {type === "expense" ? "EARNED" : "SPENT"}
          </Text>
          <ScalarAmountText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.metricValue,
              type === "expense" && styles.positiveText,
            ]}
          >
            {type === "expense"
              ? signedMoney(incomeTotal, currency, true)
              : signedMoney(expenseTotal, currency, false)}
          </ScalarAmountText>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.capsLabel}>DAILY AVG</Text>
          <ScalarAmountText numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
            {money(activeTotal / days, currency)}
          </ScalarAmountText>
        </View>
      </View>

        </View>
      </CurvyHeroPanel>

      <View style={styles.bodyContent}>
        <View style={styles.chartCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: chartExpanded }}
          onPress={() => setChartExpanded((current) => !current)}
          style={({ pressed }) => [
            styles.chartHeader,
            pressed && styles.chartHeaderPressed,
          ]}
        >
          <View style={styles.chartTitleRow}>
            <Text style={styles.capsLabel}>IN VS OUT · BY WEEK</Text>
            <MaterialCommunityIcons
              name={chartExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textTertiary}
            />
          </View>
          <View style={styles.legend}>
            <Legend color={colors.positive} label="In" styles={styles} />
            <Legend color={colors.negative} label="Out" styles={styles} />
          </View>
        </Pressable>
        <View style={styles.chartBody}>
              <View style={styles.axis}>
                {[axisMax, axisMax * 0.66, axisMax * 0.33, 0].map((value) => (
                  <Text key={value} style={styles.axisLabel}>
                    {compact(value)}
                  </Text>
                ))}
              </View>
              <View style={styles.plot}>
                {[1, 2, 3].map((line) => (
                  <View
                    key={line}
                    style={[styles.gridline, { top: `${line * 25}%` }]}
                  />
                ))}
                <View style={styles.weeks}>
                  {weekly.map((week, index) => (
                    <View key={index} style={styles.week}>
                      <View
                        style={[
                          styles.bar,
                          styles.inBar,
                          {
                            height: `${Math.max(
                              (week.income / axisMax) * 100,
                              2,
                            )}%`,
                          },
                        ]}
                      />
                      <View style={styles.outBarColumn}>
                        <View
                          style={[
                            styles.bar,
                            styles.outBar,
                            {
                              height: `${Math.max(
                                (week.expense / axisMax) * 100,
                                2,
                              )}%`,
                            },
                          ]}
                        />
                        {week.expense > 0 && (
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.expenseBarLabel,
                              {
                                bottom: `${Math.min(
                                  (week.expense / axisMax) * 100 + 5,
                                  88,
                                )}%`,
                              },
                            ]}
                          >
                            {`${currency.symbol}${compact(week.expense)}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
        </View>
        <View style={styles.xLabels}>
          {weekly.map((_, index) => (
            <Text key={index} style={styles.xLabel}>
              W{index + 1}
            </Text>
          ))}
        </View>
        {chartExpanded && (
          <>
            <View style={styles.breakdownDivider} />
            <Text style={styles.breakdownTitle}>
              {type === "expense" ? "EXPENSE" : "INCOME"} BY CATEGORY
            </Text>
            <View style={styles.breakdown}>
              {categoryBreakdown.map((category) => (
                <View key={category.name} style={styles.breakdownRow}>
                  <Text numberOfLines={1} style={styles.breakdownLabel}>
                    {category.name}
                  </Text>
                  <View style={styles.breakdownTrack}>
                    <View
                      style={[
                        styles.breakdownFill,
                        {
                          width: `${(category.total / categoryMax) * 100}%`,
                          backgroundColor:
                            category.color ||
                            (type === "expense"
                              ? colors.negative
                              : colors.positive),
                        },
                      ]}
                    />
                  </View>
                  <ScalarAmountText style={styles.breakdownAmount}>
                    {money(category.total, currency)}
                  </ScalarAmountText>
                </View>
              ))}
              {!categoryBreakdown.length && (
                <Text style={styles.breakdownEmpty}>
                  No {type} category data this month
                </Text>
              )}
            </View>
          </>
        )}
        </View>
      </View>

    </View>
  );
}

function Legend({
  color,
  label,
  styles,
}: {
  color: string;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      gap: 0,
    },
    panelContent: { paddingHorizontal: 20, gap: 12 },
    bodyContent: { paddingHorizontal: 20, paddingTop: 4 },
    heroCard: {
      gap: 10,
      padding: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    capsLabel: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caps,
    },
    overBadge: {
      borderRadius: designTokens.radius.sm,
      paddingVertical: 5,
      paddingHorizontal: 9,
      backgroundColor: colors.negative,
    },
    overBadgeText: {
      color: colors.onNegative,
      fontFamily: designTokens.font.bold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.48,
      fontWeight: "700",
    },
    heroAmount: {
      color: colors.panelText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.heroAmount,
      lineHeight: 48,
      paddingTop: 2,
    },
    limitTrack: {
      height: 8,
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgba(0,0,0,0.20)",
    },
    limitFill: {
      height: 8,
      borderRadius: 4,
    },
    limitFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    limitActionGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    limitText: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.medium,
      fontWeight: "500",
      ...designTokens.typography.caption,
    },
    limitStatus: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caption,
    },
    limitAction: {
      minHeight: 22,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    limitActionPressed: {
      backgroundColor: colors.chartGrid,
    },
    limitActionText: {
      color: colors.panelText,
      fontFamily: designTokens.font.bold,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "700",
    },
    negativeText: { color: colors.negative },
    positiveText: { color: colors.positive },
    metrics: {
      flexDirection: "row",
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: 0,
      gap: 8,
      padding: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    metricValue: {
      color: colors.panelText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
    chartCard: {
      gap: 12,
      padding: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minHeight: 44,
    },
    chartHeaderPressed: {
      backgroundColor: colors.surfaceSunken,
      borderRadius: designTokens.radius.md,
    },
    chartTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 1,
    },
    legend: { flexDirection: "row", gap: 10 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendSwatch: { width: 8, height: 8, borderRadius: 2 },
    legendText: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontWeight: "600",
      ...designTokens.typography.micro,
      letterSpacing: 0,
    },
    chartBody: { height: 112, flexDirection: "row", gap: 8 },
    axis: {
      width: 32,
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    axisLabel: {
      color: colors.textTertiary,
      fontSize: 10,
      lineHeight: 12,
      fontVariant: ["tabular-nums"],
    },
    plot: {
      flex: 1,
      position: "relative",
      borderBottomWidth: 1.5,
      borderBottomColor: colors.borderStrong,
    },
    gridline: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.surfaceRaised,
    },
    weeks: {
      position: "absolute",
      inset: 0,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-around",
    },
    week: {
      height: "100%",
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
    },
    outBarColumn: {
      width: 34,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      overflow: "visible",
    },
    expenseBarLabel: {
      position: "absolute",
      zIndex: 10,
      elevation: 10,
      color: colors.negative,
      backgroundColor: colors.surface,
      paddingHorizontal: 3,
      borderRadius: 3,
      minWidth: 42,
      textAlign: "center",
      fontFamily: designTokens.font.bold,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    bar: { width: 13, minHeight: 2, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
    inBar: { backgroundColor: colors.positive },
    outBar: { backgroundColor: colors.negative },
    xLabels: {
      paddingLeft: 40,
      flexDirection: "row",
      justifyContent: "space-around",
    },
    xLabel: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontWeight: "600",
      ...designTokens.typography.micro,
      letterSpacing: 0,
    },
    breakdownDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    breakdownTitle: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caps,
    },
    breakdown: { gap: 12 },
    breakdownRow: {
      minHeight: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    breakdownLabel: {
      width: 76,
      color: colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      fontWeight: "600",
    },
    breakdownTrack: {
      flex: 1,
      height: 10,
      overflow: "hidden",
      borderRadius: 5,
      backgroundColor: colors.surfaceSunken,
    },
    breakdownFill: {
      height: 10,
      borderRadius: 5,
    },
    breakdownAmount: {
      width: 78,
      textAlign: "right",
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 12,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    breakdownEmpty: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 13,
    },
  });
}
