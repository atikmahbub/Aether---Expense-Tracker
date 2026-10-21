import EntityDetailSheet, {
  DetailDeleteLink,
  useDetailCaptionStyle,
} from "@trackingPortal/components/scalar/EntityDetailSheet";
import { useSheetConfirm } from "@trackingPortal/components/scalar/SheetConfirm";
import { useOffline } from "@trackingPortal/contexts/OfflineProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import type { LocalCategory } from "@trackingPortal/db/repositories/CategoryRepository";
import type { LocalTransaction } from "@trackingPortal/db/repositories/TransactionRepository";
import {
  describeFrequency,
  RecurringRuleView,
} from "@trackingPortal/db/services/RecurringDataService";
import type { ExpenseCategoryModel } from "@trackingPortal/api/models";
import CategorySelector from "@trackingPortal/screens/TransactionScreen/components/CategorySelector";
import { normalizeCategoryIcon } from "@trackingPortal/screens/TransactionScreen/TransactionScreen.constants";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { parseDate } from "@trackingPortal/utils/date";
import { triggerSuccessHaptic } from "@trackingPortal/utils/haptic";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

interface RecurringRuleSheetProps {
  rule: RecurringRuleView | null;
  category?: LocalCategory;
  /** Categories of the rule's kind, for the edit picker. */
  categoryOptions: ExpenseCategoryModel[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

/**
 * A rule's detail sheet, same pattern as the loan sheet: summary card, the
 * entries it has added, edit fields, then pause and delete.
 */
export default function RecurringRuleSheet({
  rule,
  category,
  categoryOptions,
  onClose,
  onChanged,
}: RecurringRuleSheetProps) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const caption = useDetailCaptionStyle();
  const { currency } = useStoreContext();
  const { recurringData } = useDatabase();
  const { syncNow } = useOffline();
  const { confirm, panel } = useSheetConfirm();
  const [entries, setEntries] = useState<LocalTransaction[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ruleId = rule?.id;
  useEffect(() => {
    if (!rule || !recurringData) return;
    setAmount(formatNumber(rule.amount, { useGrouping: false, maximumFractionDigits: 2 }));
    setNote(rule.description ?? "");
    // The rule may hold a server category id; the picker lists local ids.
    setCategoryId(category?.id ?? rule.categoryId);
    recurringData.getEntries(rule.id).then(setEntries);
    // Only reset the fields when a different rule opens, not on every reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId, recurringData]);

  const fmt = (value: number) =>
    formatCurrency(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const run = async (action: () => Promise<void>, message: string, close = false) => {
    try {
      setBusy(true);
      await action();
      triggerSuccessHaptic();
      if (close) onClose();
      await onChanged();
      Toast.show({ type: "success", text1: message });
      syncNow();
    } catch (error) {
      console.log("recurring rule error", error);
      Toast.show({ type: "error", text1: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const income = rule?.type === "income";
  const parsedAmount = Number(amount);
  const dirty =
    Boolean(rule) &&
    (parsedAmount !== rule!.amount ||
      note.trim() !== (rule!.description ?? "") ||
      categoryId !== (category?.id ?? rule!.categoryId));
  const canSave = dirty && parsedAmount > 0 && !busy;
  const startDate = rule ? parseDate(rule.startDate) : new Date();
  const status = !rule
    ? ""
    : rule.ended
      ? "Ended"
      : rule.paused
        ? "Paused"
        : rule.nextDate
          ? `Next on ${dayjs(rule.nextDate).format("D MMM YYYY")}`
          : "";

  return (
    <EntityDetailSheet
      visible={Boolean(rule)}
      onClose={onClose}
      icon={normalizeCategoryIcon(category?.icon ?? undefined) as any}
      iconTile={category?.color ?? undefined}
      iconColor={category?.color ? "#FFFFFF" : undefined}
      title={rule?.description || category?.name || "Recurring"}
      meta={rule ? describeFrequency(rule.frequency, startDate) : ""}
      figureLabel={income ? "Income" : "Expense"}
      figure={rule ? `${income ? "+" : "−"}${fmt(rule.amount)}` : ""}
      badge={rule?.paused ? { label: "Paused" } : rule?.ended ? { label: "Ended" } : undefined}
      cardFooter={<Text style={caption}>{status}</Text>}
      takeover={panel}
    >
      {rule && (
        <>
          {entries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.capsLabel}>ADDED SO FAR</Text>
              <View style={styles.group}>
                {entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[styles.entryRow, index < entries.length - 1 && styles.divider]}
                  >
                    <Text style={styles.entryDate}>
                      {dayjs(parseDate(entry.date)).format("D MMM YYYY")}
                    </Text>
                    <Text style={styles.entryAmount}>
                      {`${income ? "+" : "−"}${fmt(entry.amount)}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!rule.ended && (
            <View style={styles.section}>
              <Text style={styles.capsLabel}>AMOUNT</Text>
              <TextInput
                accessibilityLabel="Amount"
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                style={styles.input}
                selectionColor={colors.brand}
              />
              <Text style={styles.capsLabel}>CATEGORY</Text>
              <CategorySelector
                categories={categoryOptions}
                selectedCategoryId={categoryId ?? undefined}
                onSelect={setCategoryId}
              />
              <Text style={styles.capsLabel}>NOTE</Text>
              <TextInput
                accessibilityLabel="Note"
                value={note}
                onChangeText={setNote}
                placeholder="What is this for?"
                placeholderTextColor={colors.textTertiary}
                maxLength={120}
                style={styles.input}
                selectionColor={colors.brand}
              />
              <Text style={styles.hint}>Changes apply to future entries only.</Text>
            </View>
          )}

          <View style={styles.footer}>
            {!rule.ended && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() =>
                  run(
                    () =>
                      rule.paused
                        ? recurringData!.resumeRule(rule.id)
                        : recurringData!.pauseRule(rule.id),
                    rule.paused ? "Repeat resumed" : "Repeat paused",
                  )
                }
                style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryText}>{rule.paused ? "Resume" : "Pause"}</Text>
              </Pressable>
            )}
            {!rule.ended && (
              <Pressable
                accessibilityRole="button"
                disabled={!canSave}
                onPress={() =>
                  run(
                    () =>
                      recurringData!.updateRule(rule.id, {
                        amount: parsedAmount,
                        description: note.trim() || null,
                        categoryId,
                      }),
                    "Repeat updated",
                  )
                }
                style={({ pressed }) => [
                  styles.button,
                  styles.primary,
                  !canSave && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryText}>Save changes</Text>
              </Pressable>
            )}
          </View>

          <DetailDeleteLink
            label="Delete repeat"
            disabled={busy}
            onPress={() =>
              confirm({
                title: "Stop this repeat?",
                message: "Past entries stay in your history.",
                confirmLabel: "Delete",
                destructive: true,
                onConfirm: () =>
                  run(() => recurringData!.deleteRule(rule.id), "Repeat deleted", true),
              })
            }
          />
        </>
      )}
    </EntityDetailSheet>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
    section: { gap: 8 },
    capsLabel: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
    },
    group: {
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.groupBorder,
      backgroundColor: colors.groupBg,
    },
    entryRow: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.rowDivider },
    entryDate: {
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
    },
    entryAmount: {
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
      fontVariant: ["tabular-nums"],
    },
    input: {
      height: 52,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.groupBorder,
      borderRadius: 18,
      backgroundColor: colors.groupBg,
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
    },
    hint: {
      paddingHorizontal: 6,
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    footer: { flexDirection: "row", gap: 10 },
    button: {
      height: 54,
      borderRadius: designTokens.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    // Same 1 : 1.4 split as the loan sheet's Cancel / Save row.
    secondary: {
      flex: 1,
      backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg,
    },
    secondaryText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    primary: { flex: 1.4, backgroundColor: colors.primaryButtonBg },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.75 },
  });
}
