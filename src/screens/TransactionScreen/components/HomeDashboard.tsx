import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  MonthlyLimitModel,
  TransactionModel,
} from "@trackingPortal/api/models";
import { TransactionSummaryModel } from "@trackingPortal/api/models/TransactionSummaryModel";
import {
  CurvyHeroPanel,
  CustomAppBar,
  HeroFigure,
  SplitBar,
} from "@trackingPortal/components";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { CurrencyPreference } from "@trackingPortal/constants/currency";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import CarryOverSheet from "@trackingPortal/screens/TransactionScreen/components/CarryOverSheet";
import RemainingCard, {
  RemainingStat,
} from "@trackingPortal/screens/TransactionScreen/components/RemainingCard";
import { designTokens } from "@trackingPortal/themes/designTokens";
import {
  dayStats,
  keptPercent,
  monthBalances,
  MonthlyTotals,
} from "@trackingPortal/utils/carryOver";
import { parseDate } from "@trackingPortal/utils/date";
import { useRouter } from "expo-router";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import dayjs, { Dayjs } from "dayjs";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface HomeDashboardProps {
  month: Dayjs;
  type: "expense" | "income";
  summary: TransactionSummaryModel | null;
  monthlyTotals: MonthlyTotals;
  monthlyLimit: MonthlyLimitModel;
  transactions: TransactionModel[];
  currency: CurrencyPreference;
  loading?: boolean;
  ledgerControl: React.ReactNode;
  onAdjustLimit: () => void;
  /** "hero" renders the tinted top; "sheet" renders the cash-flow block. */
  section?: "hero" | "sheet";
}

const money = (value: number, currency: CurrencyPreference) =>
  formatCurrency(value, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Proposed in the v4 handoff as the point where the limit bar drops its
// positive colour; still listed there as an open question.
const LIMIT_WARNING_RATIO = 0.85;

export default function HomeDashboard({
  month,
  type,
  summary,
  monthlyTotals,
  monthlyLimit,
  transactions,
  currency,
  loading,
  ledgerControl,
  onAdjustLimit,
  section = "hero",
}: HomeDashboardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, formatDate } = useTranslation();
  const [chartExpanded, setChartExpanded] = useState(false);
  const [carrySheetOpen, setCarrySheetOpen] = useState(false);
  const { carryOverEnabled } = useStoreContext();
  const router = useRouter();
  const expenseTotal = summary?.totalExpense ?? 0;
  const incomeTotal = summary?.totalIncome ?? 0;
  const activeTotal = type === "expense" ? expenseTotal : incomeTotal;
  const limit = monthlyLimit?.limit ?? 0;
  const ratio = limit > 0 ? expenseTotal / limit : 0;
  const difference = Math.abs(expenseTotal - limit);

  // Three limit states with transitions at 85% and 100%. "Approaching" uses
  // neutral ink rather than a new hue, so the only colour shift on the bar is
  // green -> red at the actual breach.
  const limitState: "under" | "approaching" | "over" =
    ratio >= 1
      ? "over"
      : ratio >= LIMIT_WARNING_RATIO
        ? "approaching"
        : "under";
  const isOver = type === "expense" && limitState === "over";
  const today = dayjs();
  // Weeks that have not started yet render as empty tracks, not zero bars.
  const weekStarted = (index: number) =>
    !month.isSame(today, "month") || index * 7 + 1 <= today.date();

  const weekly = useMemo(() => {
    const values = Array.from({ length: 5 }, () => ({ income: 0, expense: 0 }));
    transactions.forEach((transaction) => {
      const date = dayjs(parseDate(transaction.date));
      if (!date.isValid()) return;
      const week = Math.min(Math.floor((date.date() - 1) / 7), 4);
      values[week][transaction.type] += Math.abs(transaction.amount);
    });
    return values;
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<
      string,
      { name: string; total: number; color?: string }
    >();
    transactions
      .filter((transaction) => transaction.type === type)
      .forEach((transaction) => {
        const name = transaction.category?.name || t("wallet.uncategorized");
        const current = totals.get(name);
        totals.set(name, {
          name,
          total: (current?.total || 0) + Math.abs(transaction.amount),
          color: transaction.category?.color || current?.color,
        });
      });
    return Array.from(totals.values()).sort((a, b) => b.total - a.total);
  }, [transactions, type, t]);

  const categoryMax = Math.max(
    ...categoryBreakdown.map((category) => category.total),
    1,
  );

  // Remaining card: carry over is last month's balance, if it had income.
  const monthKey = month.format("YYYY-MM");
  const { current, previous } = useMemo(
    () => monthBalances(monthlyTotals, monthKey, carryOverEnabled),
    [monthlyTotals, monthKey, carryOverEnabled],
  );
  const { carryOver, available, remaining } = current;
  // No income and nothing carried in: there's no balance to show, so the
  // card keeps only its stats and Safe / day goes by the limit alone.
  const showBalance = current.income > 0 || carryOver > 0;
  const { dailyAvg, safePerDay: rawSafePerDay } = dayStats({
    month: monthKey,
    now: Date.now(),
    spent: current.spent,
    remaining: showBalance ? remaining : Infinity,
    limit,
  });
  // Without a balance or a limit there's nothing to pace against.
  const safePerDay = Number.isFinite(rawSafePerDay) ? rawSafePerDay : null;
  const previousMonth = month.subtract(1, "month");
  const signedMoney = (value: number) =>
    `${value < 0 ? "−" : ""}${money(Math.abs(value), currency)}`;
  // Off, or exactly zero: no "Last month" item.
  const lastMonthStat: RemainingStat | null =
    carryOverEnabled && carryOver !== 0
      ? {
          label: t("wallet.lastMonth"),
          value: signedMoney(carryOver),
          negative: carryOver < 0,
          onInfo: () => setCarrySheetOpen(true),
        }
      : null;
  const incomeChange = current.income - previous.income;
  const cardStats: RemainingStat[] = [
    ...(lastMonthStat ? [lastMonthStat] : []),
    ...(type === "expense"
      ? [
          { label: t("wallet.dailyAvg"), value: money(dailyAvg, currency) },
          // Past months: no Safe / day.
          ...(safePerDay === null
            ? []
            : [
                safePerDay > 0
                  ? { label: t("wallet.safePerDay"), value: money(safePerDay, currency) }
                  : {
                      label: t("wallet.safePerDay"),
                      value: t("wallet.nothingLeft"),
                      negative: true,
                    },
              ]),
        ]
      : [
          {
            label: t("wallet.kept"),
            value: `${keptPercent(current.income, current.spent)}%`,
          },
          {
            label: t("wallet.vsMonth", { month: formatDate(previousMonth, "MMMM") }),
            value: `${incomeChange > 0 ? "+" : ""}${signedMoney(incomeChange)}`,
            negative: incomeChange < 0,
          },
        ]),
  ];

  if (section === "hero") {
    return (
      <CurvyHeroPanel>
        <CustomAppBar />
        <View style={styles.panelContent}>
          {ledgerControl}
          <HeroFigure
            size={40}
            label={t(
              type === "expense" ? "wallet.spentIn" : "wallet.incomeIn",
              {
                month: formatDate(month, "MMMM"),
              },
            )}
            amount={loading ? "…" : money(activeTotal, currency)}
          />
          {type === "expense" &&
            (limit > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  isOver ? "wallet.raiseLimit" : "wallet.adjustLimit",
                )}
                onPress={onAdjustLimit}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <SplitBar
                  ratio={ratio}
                  limitLabel={t("wallet.limit", {
                    amount: money(limit, currency),
                  })}
                  leftLabel={t(isOver ? "wallet.over" : "wallet.limitLeft")}
                  spentLabel={t("wallet.spent")}
                  leftAmount={money(difference, currency)}
                />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={onAdjustLimit}
                style={({ pressed }) => [
                  styles.setLimit,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.setLimitText}>{t("wallet.noLimit")}</Text>
                <Text style={styles.setLimitAction}>
                  {t("wallet.setLimitAction")}
                </Text>
              </Pressable>
            ))}
          <RemainingCard
            label={t("wallet.remaining")}
            value={signedMoney(remaining)}
            negative={remaining < 0}
            available={t("wallet.ofAvailable", {
              amount: signedMoney(available),
            })}
            stats={cardStats}
            showBalance={showBalance}
          />
          <CarryOverSheet
            visible={carrySheetOpen}
            onClose={() => setCarrySheetOpen(false)}
            onOpenSettings={() => {
              setCarrySheetOpen(false);
              router.push("/settings");
            }}
            breakdown={{
              amount: signedMoney(carryOver),
              overspent: money(Math.abs(carryOver), currency),
              negative: carryOver < 0,
              fromMonth: formatDate(previousMonth, "MMMM"),
              toMonth: formatDate(month, "MMMM"),
              income: `+${money(previous.income, currency)}`,
              spent: `−${money(previous.spent, currency)}`,
            }}
          />
        </View>
      </CurvyHeroPanel>
    );
  }

  const barMax = Math.max(
    ...weekly.flatMap((week) => [week.income, week.expense]),
    1,
  );
  // Bars top out below the track so the value labels fit above them.
  const BAR_MAX = 42;
  const barHeight = (value: number) =>
    Math.max(Math.round((value / barMax) * BAR_MAX), 6);
  const compact = (value: number) =>
    `${currency.symbol}${
      value >= 1000
        ? `${formatNumber(value / 1000, { maximumFractionDigits: value >= 10000 ? 0 : 1 })}k`
        : formatNumber(value, { maximumFractionDigits: 0 })
    }`;

  return (
    <View style={styles.flow}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: chartExpanded }}
        onPress={() => setChartExpanded((current) => !current)}
        style={styles.chartHeader}
      >
        <Text style={styles.sheetTitle}>{t("wallet.cashFlow")}</Text>
        <View style={styles.legend}>
          <Legend
            color={colors.chartIn}
            label={t("wallet.in")}
            styles={styles}
          />
          <Legend
            color={colors.chartOut}
            label={t("wallet.out")}
            styles={styles}
          />
          <Text style={styles.byWeek}>{t("wallet.byWeek")}</Text>
          <MaterialCommunityIcons
            name={chartExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </Pressable>
      <View style={styles.weeks}>
        {weekly.map((week, index) => {
          const started = weekStarted(index);
          return (
            <View key={index} style={styles.week}>
              <View style={styles.barPair}>
                {started && (week.income > 0 || week.expense > 0) && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.barLabels,
                      {
                        bottom:
                          Math.max(
                            week.income > 0 ? barHeight(week.income) : 0,
                            week.expense > 0 ? barHeight(week.expense) : 0,
                          ) + 3,
                      },
                    ]}
                  >
                    {week.income > 0 && (
                      <ScalarAmountText
                        numberOfLines={1}
                        style={[styles.barLabel, { color: colors.chartIn }]}
                      >
                        {compact(week.income)}
                      </ScalarAmountText>
                    )}
                    {week.expense > 0 && (
                      <ScalarAmountText
                        numberOfLines={1}
                        style={[styles.barLabel, { color: colors.chartOut }]}
                      >
                        {compact(week.expense)}
                      </ScalarAmountText>
                    )}
                  </View>
                )}
                <View
                  style={[
                    styles.bar,
                    started
                      ? {
                          height: barHeight(week.income),
                          backgroundColor: colors.chartIn,
                        }
                      : styles.emptyBar,
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    started
                      ? {
                          height: barHeight(week.expense),
                          backgroundColor: colors.chartOut,
                        }
                      : styles.emptyBar,
                  ]}
                />
              </View>
              <Text style={styles.xLabel}>
                {t("wallet.weekShort", { n: index + 1 })}
              </Text>
            </View>
          );
        })}
      </View>
      {chartExpanded && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>
            {t(
              type === "expense"
                ? "wallet.expenseByCategory"
                : "wallet.incomeByCategory",
            )}
          </Text>
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
                        (type === "expense" ? colors.chartOut : colors.chartIn),
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
              {t(
                type === "expense"
                  ? "wallet.noExpenseCategoryData"
                  : "wallet.noIncomeCategoryData",
              )}
            </Text>
          )}
        </View>
      )}
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
    panelContent: { paddingHorizontal: 22, gap: 16 },
    pressed: { opacity: 0.75 },
    setLimit: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.chipIdleBg,
    },
    setLimitText: {
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    setLimitAction: {
      color: colors.heroText,
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
    },
    flow: { gap: 12, paddingBottom: 8 },
    chartHeader: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sheetTitle: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 18,
      lineHeight: 24,
    },
    legend: { flexDirection: "row", alignItems: "center", gap: 12 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendSwatch: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      color: colors.softChipInk,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
    byWeek: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      fontSize: 13,
    },
    weeks: {
      height: 86,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    week: { alignItems: "center", gap: 6 },
    barPair: {
      height: 68,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 5,
    },
    bar: { width: 7, borderRadius: 999 },
    // Wider than the bar pair and centred on it; labels stack In over Out.
    barLabels: {
      position: "absolute",
      left: -26,
      right: -26,
      alignItems: "center",
    },
    barLabel: {
      fontFamily: designTokens.font.semibold,
      fontSize: 10,
      lineHeight: 12,
      fontVariant: ["tabular-nums"],
    },
    emptyBar: { height: 68, backgroundColor: colors.chartEmpty },
    xLabel: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 11,
    },
    breakdown: { gap: 12, paddingTop: 4 },
    breakdownTitle: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
      textTransform: "uppercase",
    },
    breakdownRow: {
      minHeight: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    breakdownLabel: {
      width: 76,
      color: colors.softChipInk,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
    breakdownTrack: {
      flex: 1,
      height: 8,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: colors.softChipBg,
    },
    breakdownFill: {
      height: 8,
      borderRadius: 999,
    },
    breakdownAmount: {
      width: 78,
      textAlign: "right",
      color: colors.sheetText,
      fontFamily: designTokens.font.bold,
      fontSize: 12,
      fontVariant: ["tabular-nums"],
    },
    breakdownEmpty: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
  });
}
