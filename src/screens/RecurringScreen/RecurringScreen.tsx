import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import ScalarListRow from "@trackingPortal/components/ScalarListRow";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { ScreenGradient } from "@trackingPortal/components/scalar";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import type { LocalCategory } from "@trackingPortal/db/repositories/CategoryRepository";
import {
  FREQUENCY_LABEL,
  monthlyEquivalent,
  ordinal,
  RecurringRuleView,
} from "@trackingPortal/db/services/RecurringDataService";
import RecurringRuleSheet from "@trackingPortal/screens/RecurringScreen/RecurringRuleSheet";
import { requestCreation } from "@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation";
import { normalizeCategoryIcon } from "@trackingPortal/screens/TransactionScreen/TransactionScreen.constants";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { formatCurrency } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/** Tappable starting points on the empty screen; each prefills the add form. */
const EXAMPLES = [
  { description: "Rent", type: "Expense", day: 1, icon: "home-outline" },
  { description: "Salary", type: "Income", day: 28, icon: "briefcase-outline" },
  { description: "Netflix", type: "Expense", day: 12, icon: "television-classic" },
] as const;

/** The next date falling on `day` of a month, today included. */
const nextOnDay = (day: number) => {
  const today = dayjs().startOf("day");
  const thisMonth = today.date(day);
  return (thisMonth.isBefore(today) ? thisMonth.add(1, "month") : thisMonth).toDate();
};

export type CategoryLookup = Record<string, LocalCategory>;

export default function RecurringScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams<{ rule?: string }>();
  const { currentUser: user, currency } = useStoreContext();
  const { recurringData, repositories } = useDatabase();
  const [rules, setRules] = useState<RecurringRuleView[]>([]);
  const [categories, setCategories] = useState<CategoryLookup>({});
  const [loaded, setLoaded] = useState(false);
  const [endedOpen, setEndedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(params.rule ?? null);

  const load = useCallback(async () => {
    if (!recurringData || !repositories || !user.userId) return;
    const [list, cats] = await Promise.all([
      recurringData.getRules(user.userId),
      repositories.categories.getAll(),
    ]);
    const lookup: CategoryLookup = {};
    for (const c of cats) {
      lookup[c.id] = c;
      if (c.serverId) lookup[c.serverId] = c;
    }
    setRules(list);
    setCategories(lookup);
    setLoaded(true);
  }, [recurringData, repositories, user.userId]);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  useEffect(() => {
    eventEmitter.on(EVENTS.OFFLINE_SYNC_COMPLETED, load);
    return () => eventEmitter.off(EVENTS.OFFLINE_SYNC_COMPLETED, load);
  }, [load]);

  const fmt = (value: number) =>
    formatCurrency(value, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const live = rules.filter((r) => !r.ended);
  const ended = rules.filter((r) => r.ended);
  const expenses = live.filter((r) => r.type === "expense");
  const income = live.filter((r) => r.type === "income");
  // Paused rules don't add anything, so they stay out of the monthly figure.
  const monthlyTotal = (list: RecurringRuleView[]) =>
    list.filter((r) => !r.paused).reduce((sum, r) => sum + monthlyEquivalent(r), 0);
  const selectedRule = rules.find((r) => r.id === selectedId) ?? null;

  const addRecurring = (example?: (typeof EXAMPLES)[number]) => {
    requestCreation({
      type: example?.type ?? "Expense",
      description: example?.description ?? "",
      repeat: "monthly",
      date: example ? nextOnDay(example.day) : new Date(),
    });
    router.navigate("/(tabs)/transactions");
  };

  const renderRule = (rule: RecurringRuleView, index: number, list: RecurringRuleView[]) => {
    const category = rule.categoryId ? categories[rule.categoryId] : undefined;
    const isIncome = rule.type === "income";
    const when = rule.ended
      ? "Ended"
      : rule.paused
        ? "Paused"
        : rule.nextDate
          ? `next on ${dayjs(rule.nextDate).format("D MMM")}`
          : "";
    return (
      <View key={rule.id} style={rule.paused && styles.paused}>
        <ScalarListRow
          grouped
          title={rule.description || category?.name || "Recurring"}
          meta={`${FREQUENCY_LABEL[rule.frequency]} · ${when}`}
          amount={`${isIncome ? "+" : "−"}${fmt(rule.amount)}`}
          positive={isIncome}
          icon={normalizeCategoryIcon(category?.icon ?? undefined) as any}
          categoryName={category?.name}
          categoryColor={category?.color ?? undefined}
          showDivider={index < list.length - 1}
          onPress={() => setSelectedId(rule.id)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isDark && <ScreenGradient />}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Recurring</Text>
        {rules.length ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add recurring"
            onPress={() => addRecurring()}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      {loaded && !rules.length ? (
        <View style={styles.emptyRoot}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emptyLead}>
              Set a payment up once and Scalar adds it on the day it’s due. It
              counts in your totals like any other entry.
            </Text>
            <Text style={styles.sectionLabel}>FOR EXAMPLE</Text>
            <View style={styles.card}>
              {EXAMPLES.map((example, index) => (
                <Pressable
                  key={example.description}
                  accessibilityRole="button"
                  onPress={() => addRecurring(example)}
                  style={({ pressed }) => [
                    styles.exampleRow,
                    index < EXAMPLES.length - 1 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.exampleTile}>
                    <MaterialCommunityIcons
                      name={example.icon}
                      size={20}
                      color={colors.groupIconInk}
                    />
                  </View>
                  <View style={styles.exampleText}>
                    <Text style={styles.exampleTitle}>{example.description}</Text>
                    <Text style={styles.exampleMeta}>
                      Monthly on the {ordinal(example.day)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={() => addRecurring()}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Add recurring</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Monthly recurring</Text>
            <View style={styles.summaryRow}>
              <ScalarAmountText style={styles.summaryFigure}>
                {`−${fmt(monthlyTotal(expenses))}`}
              </ScalarAmountText>
              <Text style={styles.summaryUnit}>out</Text>
              <Text style={styles.summaryUnit}>·</Text>
              <ScalarAmountText style={[styles.summaryFigure, styles.positive]}>
                {`+${fmt(monthlyTotal(income))}`}
              </ScalarAmountText>
              <Text style={styles.summaryUnit}>in</Text>
            </View>
          </View>

          {expenses.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>EXPENSES</Text>
              <View style={styles.card}>{expenses.map(renderRule)}</View>
            </>
          )}
          {income.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>INCOME</Text>
              <View style={styles.card}>{income.map(renderRule)}</View>
            </>
          )}

          {ended.length > 0 && (
            <View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: endedOpen }}
                onPress={() => setEndedOpen((v) => !v)}
                style={styles.endedHeader}
              >
                <Text style={styles.endedTitle}>Ended · {ended.length}</Text>
                <MaterialCommunityIcons
                  name={endedOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {endedOpen && <View style={styles.card}>{ended.map(renderRule)}</View>}
            </View>
          )}
        </ScrollView>
      )}

      <RecurringRuleSheet
        rule={selectedRule}
        category={
          selectedRule?.categoryId ? categories[selectedRule.categoryId] : undefined
        }
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    // Screen titles use the wide display face, as on Settings.
    title: {
      fontSize: 20,
      color: colors.text,
      fontFamily: designTokens.font.display,
      letterSpacing: -0.4,
    },
    content: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
    summary: { gap: 4, paddingHorizontal: 4, paddingBottom: 10 },
    summaryLabel: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    summaryRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 },
    summaryFigure: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.display,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    positive: { color: colors.positive },
    summaryUnit: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
    },
    sectionLabel: {
      paddingTop: 6,
      paddingHorizontal: 4,
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
    },
    card: {
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      borderRadius: designTokens.radius.group,
      backgroundColor: colors.listCardBg,
    },
    paused: { opacity: 0.45 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.rowDivider },
    endedHeader: {
      minHeight: 44,
      marginTop: 6,
      paddingHorizontal: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    endedTitle: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 13,
      letterSpacing: 0.5,
    },
    emptyRoot: { flex: 1 },
    emptyLead: {
      paddingHorizontal: 4,
      paddingBottom: 12,
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    exampleRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    exampleTile: {
      width: 44,
      height: 44,
      borderRadius: designTokens.radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.softChipBg,
    },
    exampleText: { flex: 1, gap: 2 },
    exampleTitle: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    exampleMeta: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    primary: {
      position: "absolute",
      left: 22,
      right: 22,
      bottom: 40,
      height: 54,
      borderRadius: designTokens.radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryButtonBg,
    },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    pressed: { opacity: 0.75 },
  });
}
