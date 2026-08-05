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
import Animated, { LinearTransition } from "react-native-reanimated";

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

// Proposed in the v4 handoff as the point where the limit bar drops its
// positive colour; still listed there as an open question.
const LIMIT_WARNING_RATIO = 0.85;

// Round the axis up to the nearest "readable" number just above the data, so
// the tallest bar nearly fills the plot. Fixed 20k steps left the chart
// two-thirds empty whenever the month's peak sat just over a boundary.
const niceCeil = (value: number) => {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
    (candidate) => normalized <= candidate,
  );
  return (step ?? 10) * magnitude;
};

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
  const difference = Math.abs(expenseTotal - limit);
  const days = Math.max(month.daysInMonth(), 1);

  // Three limit states with transitions at 85% and 100%. "Approaching" uses
  // neutral ink rather than a new hue, so the only colour shift on the bar is
  // green -> red at the actual breach.
  const limitState: "under" | "approaching" | "over" =
    ratio >= 1 ? "over" : ratio >= LIMIT_WARNING_RATIO ? "approaching" : "under";
  const isOver = type === "expense" && limitState === "over";
  const progress = type === "expense" && limit > 0 ? Math.min(ratio, 1) : 0;
  // In the over state the bar is full width and represents total spend, so the
  // limit falls at limit/spent along it. The distance past the notch reads as
  // the overage.
  const notchLeft = ratio > 1 ? (1 / ratio) * 100 : 100;

  const limitFillColor =
    limitState === "over"
      ? colors.panelNegative
      : limitState === "approaching"
        ? colors.panelText
        : colors.panelPositive;

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
  const axisMax = niceCeil(chartMax);

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
              <MaterialCommunityIcons
                name="triangle"
                size={8}
                color={colors.onNegative}
              />
              <Text style={styles.overBadgeText}>
                {formatNumber(ratio * 100, { maximumFractionDigits: 0 })}% OVER
              </Text>
            </View>
          )}
        </View>
        {/* No adjustsFontSizeToFit here: the ৳ is a second font run (Noto Sans
            Bengali), and iOS mis-measures multi-run text badly enough at this
            size to shrink it to a few pixels, ignoring minimumFontScale. The
            tile is full-bleed, so the amount fits without shrinking. */}
        <ScalarAmountText numberOfLines={1} style={styles.heroAmount}>
          {loading ? "…" : money(activeTotal, currency)}
        </ScalarAmountText>
        {type === "expense" && (
          <>
            {limit > 0 && (
              <View style={styles.limitTrack}>
                <Animated.View
                  layout={LinearTransition.springify().damping(20).stiffness(180)}
                  style={[
                    styles.limitFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: limitFillColor,
                    },
                  ]}
                />
                {isOver && (
                  <View style={[styles.limitNotch, { left: `${notchLeft}%` }]} />
                )}
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
                  // The pill is 23px tall by design; hitSlop keeps the touch
                  // area near the 44px minimum without enlarging the visual.
                  hitSlop={{ top: 11, bottom: 11, left: 8, right: 8 }}
                  style={({ pressed }) => [
                    styles.limitAction,
                    { borderColor: limitFillColor },
                    pressed && styles.limitActionPressed,
                  ]}
                >
                  <Text style={[styles.limitActionText, { color: limitFillColor }]}>
                    {limit <= 0
                      ? "Set limit"
                      : isOver
                        ? "Raise limit"
                        : "Adjust limit"}
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
                  {isOver
                    ? `${money(difference, currency)} over`
                    : limitState === "approaching"
                      ? `${money(difference, currency)} left · ${formatNumber(
                          ratio * 100,
                          { maximumFractionDigits: 0 },
                        )}%`
                      : `${money(difference, currency)} left`}
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
            <Text style={styles.cardCapsLabel}>IN VS OUT · BY WEEK</Text>
            <View style={styles.chartToggle}>
              <MaterialCommunityIcons
                name={chartExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.brandText}
              />
            </View>
          </View>
          <View style={styles.legend}>
            <Legend color={colors.positive} label="In" styles={styles} />
            <Legend color={colors.negativeFill} label="Out" styles={styles} />
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
                {/* Aligned to the top three axis labels (which space-between at
                    0/33/66/100%); the 0 line is the plot's own baseline. These
                    sat at 25/50/75% and so lined up with nothing. */}
                {[0, 1, 2].map((line) => (
                  <View
                    key={line}
                    style={[styles.gridline, { top: `${(line * 100) / 3}%` }]}
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
                      <View style={styles.outBarSlot}>
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
                                  (week.expense / axisMax) * 100 + 4,
                                  86,
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
            <Text style={styles.cardCapsLabel}>
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
    bodyContent: { paddingHorizontal: 20, paddingTop: 6 },
    heroCard: {
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
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
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      ...designTokens.typography.caps,
    },
    overBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: designTokens.radius.full,
      paddingVertical: 5,
      paddingHorizontal: 9,
      backgroundColor: colors.negative,
    },
    overBadgeText: {
      color: colors.onNegative,
      fontFamily: designTokens.font.extraBold,
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 1.32,
      fontWeight: "800",
    },
    heroAmount: {
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.heroAmount,
    },
    limitTrack: {
      height: 8,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.20)",
    },
    limitFill: {
      height: 8,
      borderRadius: 999,
    },
    // Marks where the limit fell once the bar is full width, so the run past it
    // is legible as the overage.
    limitNotch: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 2,
      marginLeft: -1,
      backgroundColor: "#FFFFFF",
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
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      ...designTokens.typography.caption,
    },
    // Outlined in the current limit-state colour, not filled — the pill has to
    // read as a control without competing with the bar.
    limitAction: {
      minHeight: 23,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1.25,
      backgroundColor: "transparent",
    },
    limitActionPressed: {
      backgroundColor: colors.panelTile,
    },
    limitActionText: {
      fontFamily: designTokens.font.extraBold,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "800",
    },
    negativeText: { color: colors.panelNegative },
    positiveText: { color: colors.panelPositive },
    metrics: {
      flexDirection: "row",
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: designTokens.radius.tile,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    metricValue: {
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
    chartCard: {
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: designTokens.radius.tile,
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
      gap: 6,
      flexShrink: 1,
    },
    // The bare caret the spec draws is too faint to find on a dark card, so the
    // chevron gets a tinted disc to read as a control. Tap target stays the
    // whole 44px header row.
    chartToggle: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.brandWash,
    },
    legend: { flexDirection: "row", gap: 10 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendSwatch: { width: 9, height: 9, borderRadius: 2 },
    legendText: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.micro,
      letterSpacing: 0,
    },
    chartBody: {
      height: designTokens.chart.plotHeight,
      flexDirection: "row",
      gap: 8,
    },
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
    // Full-strength 1px rules, as in the spec. At hairline width and 0.42 alpha
    // these were effectively invisible, so the plot read as an empty box.
    gridline: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.chartGrid,
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
      gap: designTokens.chart.barGap,
    },
    // Wider than the bar so the value label fits inside the slot's own bounds
    // rather than overflowing it (Android clips overflow). The negative margins
    // cancel the extra width, so the slot still occupies exactly one bar and the
    // In/Out pair keeps its 4px gap.
    outBarSlot: {
      width: designTokens.chart.barWidth + 26,
      marginHorizontal: -13,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    expenseBarLabel: {
      position: "absolute",
      zIndex: 10,
      elevation: 10,
      color: colors.negative,
      // Matches the card so the label reads over a gridline without colliding.
      backgroundColor: colors.surface,
      paddingHorizontal: 3,
      borderRadius: 3,
      textAlign: "center",
      fontFamily: designTokens.font.bold,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    bar: {
      width: designTokens.chart.barWidth,
      minHeight: 3,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    inBar: { backgroundColor: colors.positive },
    outBar: { backgroundColor: colors.negativeFill },
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
    // Same eyebrow, but off the panel — body-secondary ink instead of
    // panel-secondary.
    cardCapsLabel: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
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
