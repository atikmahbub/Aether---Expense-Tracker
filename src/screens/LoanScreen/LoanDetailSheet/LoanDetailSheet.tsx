import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import {
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from "@trackingPortal/api/primitives";
import { BaseBottomSheet } from "@trackingPortal/components";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import ScalarCalendar from "@trackingPortal/components/ScalarCalendar";
import { useSheetConfirm } from "@trackingPortal/components/scalar/SheetConfirm";
import { useOffline } from "@trackingPortal/contexts/OfflineProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import type { LoanPaymentView } from "@trackingPortal/db/services/LoanDataService";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { triggerSuccessHaptic } from "@trackingPortal/utils/haptic";
import { formatCurrency } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  InteractionManager,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type Tab = "repay" | "edit";

interface LoanDetailSheetProps {
  /** The loan to show; null keeps the sheet closed. */
  loan: LoanModel | null;
  payments: LoanPaymentView[];
  onClose: () => void;
  /** Re-reads loans and payments after a write. */
  onChanged: () => Promise<void> | void;
}

const toDate = (seconds?: string | null) =>
  dayjs(makeUnixTimestampToNumber(Number(seconds)));

/** Parses user-typed money, tolerating grouping commas. NaN when invalid. */
const parseAmount = (text: string) => {
  const cleaned = text.replace(/,/g, "").trim();
  return cleaned ? Number(cleaned) : NaN;
};

/**
 * Loan detail: opens on Repay (outstanding card, amount entry with quick
 * picks, history); Edit is one tap away on the segmented control.
 */
export default function LoanDetailSheet({
  loan: loanProp,
  payments: paymentsProp,
  onClose,
  onChanged,
}: LoanDetailSheetProps) {
  // Keep showing the last loan while the sheet slides away; clearing the
  // content first left an empty panel animating down.
  const visible = loanProp !== null;
  const lastLoan = useRef<LoanModel | null>(loanProp);
  const lastPayments = useRef<LoanPaymentView[]>(paymentsProp);
  if (loanProp) {
    lastLoan.current = loanProp;
    lastPayments.current = paymentsProp;
  }
  const loan = lastLoan.current;
  const payments = lastPayments.current;
  const { colors, isDark } = useAppTheme();
  const { t, formatDate } = useTranslation();
  const palette = useMemo(() => makePalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => makeStyles(colors, palette), [colors, palette]);
  const { currentUser: user, currency } = useStoreContext();
  const { loanData } = useDatabase();
  const { syncNow } = useOffline();
  const { confirm, panel: confirmPanel, cancel: cancelConfirm } = useSheetConfirm();

  const [tab, setTab] = useState<Tab>("repay");
  const [busy, setBusy] = useState(false);
  const [calendar, setCalendar] = useState<"payment" | "deadline" | null>(null);

  // Repay form
  const [amountText, setAmountText] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentNote, setPaymentNote] = useState("");

  // Edit form
  const [name, setName] = useState("");
  const [principalText, setPrincipalText] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [purpose, setPurpose] = useState("");
  const [loanType, setLoanType] = useState<LoanType>(LoanType.GIVEN);

  const resetForms = (target: LoanModel) => {
    setTab("repay");
    setAmountText("");
    setPaymentDate(new Date());
    setPaymentNote("");
    setName(target.name);
    setPrincipalText(String(target.amount));
    setDeadline(toDate(target.deadLine).toDate());
    setPurpose(target.note ?? "");
    setLoanType(target.loanType);
  };

  // Fresh forms each time a loan opens (not when it closes, so the content
  // stays put during the slide-out).
  const openId = loanProp?.id;
  useEffect(() => {
    if (!loanProp) return;
    cancelConfirm();
    resetForms(loanProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const fmt = (value: number) =>
    formatCurrency(value, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  if (!loan) {
    return <BaseBottomSheet index={-1} onClose={onClose}>{null}</BaseBottomSheet>;
  }

  const given = loan.loanType === LoanType.GIVEN;
  const settled = Boolean(loan.settledAt);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(Math.round((loan.amount - paid) * 100) / 100, 0);
  const progress = loan.amount > 0 ? Math.min(paid / loan.amount, 1) : 0;
  const due = toDate(loan.deadLine);
  const overdueDays = dayjs().startOf("day").diff(due.startOf("day"), "day");

  const amount = parseAmount(amountText);
  // Cents comparison so typing the exact remaining amount always passes.
  const amountValid =
    amount > 0 && Math.round(amount * 100) <= Math.round(remaining * 100);
  const amountTooHigh = amount > 0 && !amountValid;

  /**
   * Writes locally, then (by default) closes the sheet straight away and
   * refreshes the list + syncs only after the slide-out, so the list doesn't
   * re-render under the animating sheet.
   */
  const run = async (action: () => Promise<void>, success: string, close = true) => {
    if (!loanData || busy) return;
    try {
      setBusy(true);
      Keyboard.dismiss();
      await action();
      triggerSuccessHaptic();
      Toast.show({ type: "success", text1: success });
      if (close) {
        onClose();
        InteractionManager.runAfterInteractions(async () => {
          await onChanged();
          syncNow();
        });
      } else {
        await onChanged();
        syncNow();
      }
    } catch {
      Toast.show({ type: "error", text1: t("common.somethingWrongBang") });
    } finally {
      setBusy(false);
    }
  };

  const addPayment = () =>
    run(async () => {
      await loanData!.addPayment({
        userId: user.userId,
        loanId: loan.id,
        amount,
        date: makeUnixTimestampString(Number(paymentDate)),
        note: paymentNote.trim() || null,
      });
      setAmountText("");
      setPaymentNote("");
      setPaymentDate(new Date());
    }, t("loan.paymentRecorded"));

  const confirmSettle = () =>
    confirm({
      title: t("loan.settleTitle"),
      message: t("loan.settleMessage", { amount: fmt(remaining) }),
      confirmLabel: t("loan.settle"),
      onConfirm: () => run(() => loanData!.settleLoan(loan.id), t("loan.settled")),
    });

  const confirmDeletePayment = (payment: LoanPaymentView) =>
    confirm({
      title: t("loan.deletePaymentTitle"),
      message: t("loan.deletePaymentMessage", { amount: fmt(payment.amount) }),
      confirmLabel: t("common.delete"),
      destructive: true,
      // Stays open so several payments can be removed in a row.
      onConfirm: () => run(() => loanData!.deletePayment(payment.id), t("loan.paymentDeleted"), false),
    });

  const principal = parseAmount(principalText);
  const editValid = name.trim().length > 0 && principal > 0;

  const saveEdit = () =>
    run(
      () =>
        loanData!.updateLoan(loan.id, {
          name: name.trim(),
          amount: principal,
          deadLine: makeUnixTimestampString(Number(deadline)),
          note: purpose.trim() || null,
          loanType,
        }),
      t("loan.updated"),
    );

  const confirmDeleteLoan = () =>
    confirm({
      title: t("loan.deleteTitle"),
      message: t("loan.deleteMessage", { name: loan.name }),
      confirmLabel: t("common.delete"),
      destructive: true,
      onConfirm: () => run(() => loanData!.deleteLoan(loan.id), t("common.deleted")),
    });

  const quickPicks = [
    { label: "25%", value: remaining * 0.25 },
    { label: "50%", value: remaining * 0.5 },
    { label: t("loan.full", { amount: fmt(remaining) }), value: remaining },
  ].map((pick) => ({ ...pick, value: Math.round(pick.value * 100) / 100 }));

  return (
    <BaseBottomSheet index={visible ? 1 : -1} onClose={onClose}>
      {confirmPanel ?? (
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTile}>
            <MaterialCommunityIcons
              name={settled ? "check" : given ? "arrow-top-right" : "arrow-bottom-left"}
              size={20}
              color={colors.sheetText}
            />
          </View>
          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.title}>{loan.name}</Text>
            <Text numberOfLines={1} style={styles.meta}>
              {t("loan.typeDue", {
                type: t(given ? "loan.given" : "loan.taken"),
                date: formatDate(due, "D MMM YYYY"),
              })}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.sheetText} />
          </Pressable>
        </View>

        {/* Outstanding */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardFigure}>
              <Text style={styles.muted13}>{t(settled ? "loan.statusSettled" : "loan.outstanding")}</Text>
              <ScalarAmountText style={styles.outstanding}>
                {fmt(settled ? 0 : remaining)}
              </ScalarAmountText>
            </View>
            {settled ? (
              <Text style={[styles.badge, styles.badgeNeutral]}>
                {t("loan.settledBadge", { date: formatDate(toDate(loan.settledAt), "D MMM") })}
              </Text>
            ) : overdueDays > 0 ? (
              <Text style={[styles.badge, styles.badgeNegative]}>
                {overdueDays === 1
                  ? t("loan.overdueDay")
                  : t("loan.overdueDays", { n: overdueDays })}
              </Text>
            ) : null}
          </View>
          <View
            style={styles.track}
            accessibilityLabel={t("loan.repaid", { pct: Math.round(progress * 100) })}
          >
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.cardFoot}>
            <Text style={styles.muted13}>Repaid {fmt(paid)}</Text>
            <Text style={styles.muted13}>of {fmt(loan.amount)}</Text>
          </View>
        </View>

        <Segmented
          options={[
            { value: "repay", label: t("loan.repay") },
            { value: "edit", label: t("loan.edit") },
          ]}
          value={tab}
          onChange={(next) => setTab(next as Tab)}
          styles={styles}
        />

        {tab === "repay" ? (
          <>
            {!settled && (
              <>
                <View style={styles.entry}>
                  <Text style={styles.muted13}>{t("loan.recordPayment")}</Text>
                  <View style={styles.entryRow}>
                    <Text style={styles.entrySymbol}>{currency.symbol}</Text>
                    <TextInput
                      value={amountText}
                      onChangeText={setAmountText}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={styles.entryInput}
                      accessibilityLabel={t("loan.paymentAmount")}
                    />
                  </View>
                  {amountTooHigh && (
                    <Text style={styles.error}>
                      {t("loan.atMost", { amount: fmt(remaining) })}
                    </Text>
                  )}
                  <View style={styles.picks}>
                    {quickPicks.map((pick) => {
                      const active = amountValid && Math.abs(amount - pick.value) < 0.005;
                      return (
                        <Pressable
                          key={pick.label}
                          accessibilityRole="button"
                          onPress={() => setAmountText(String(pick.value))}
                          style={[styles.pick, active && styles.pickActive]}
                        >
                          <Text style={[styles.pickText, active && styles.pickTextActive]}>
                            {pick.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.group}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCalendar("payment")}
                    style={[styles.groupRow, styles.groupDivider]}
                  >
                    <Text style={styles.groupLabel}>{t("loan.date")}</Text>
                    <View style={styles.groupValueWrap}>
                      <Text style={styles.groupValue}>
                        {dayjs(paymentDate).isSame(dayjs(), "day")
                          ? t("loan.todayDate", { date: formatDate(paymentDate, "D MMM") })
                          : formatDate(paymentDate, "D MMM YYYY")}
                      </Text>
                      <Chevron color={colors.textMuted} />
                    </View>
                  </Pressable>
                  <View style={styles.groupRow}>
                    <Text style={styles.groupLabel}>{t("loan.note")}</Text>
                    <TextInput
                      value={paymentNote}
                      onChangeText={setPaymentNote}
                      placeholder={t("loan.optional")}
                      placeholderTextColor={colors.textMuted}
                      style={styles.groupInput}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.history}>
              <Text style={styles.historyTitle}>{t("loan.historyTitle")}</Text>
              {payments.length ? (
                payments.map((payment) => (
                  <View key={payment.id} style={styles.historyRow}>
                    <View style={styles.historyText}>
                      <ScalarAmountText style={styles.historyAmount}>
                        {fmt(payment.amount)}
                      </ScalarAmountText>
                      <Text numberOfLines={1} style={styles.muted13}>
                        {formatDate(toDate(payment.date), "D MMM YYYY")}
                        {payment.note ? ` · ${payment.note}` : ""}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("loan.deletePayment")}
                      hitSlop={10}
                      disabled={busy}
                      onPress={() => confirmDeletePayment(payment)}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>{t("loan.noRepayments")}</Text>
              )}
            </View>

            <View style={styles.footer}>
              {settled ? (
                <FooterButton
                  label={t("loan.reopen")}
                  primary
                  wide
                  disabled={busy}
                  onPress={() => run(() => loanData!.reopenLoan(loan.id), t("loan.reopened"))}
                  styles={styles}
                />
              ) : (
                <>
                  <FooterButton
                    label={t("loan.markSettled")}
                    disabled={busy}
                    onPress={confirmSettle}
                    styles={styles}
                  />
                  <FooterButton
                    label={amountValid ? t("loan.addAmount", { amount: fmt(amount) }) : t("loan.addPayment")}
                    primary
                    disabled={busy || !amountValid}
                    onPress={addPayment}
                    styles={styles}
                  />
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <Segmented
              options={[
                { value: String(LoanType.GIVEN), label: "↗ Given" },
                { value: String(LoanType.TAKEN), label: "↙ Taken" },
              ]}
              value={String(loanType)}
              onChange={(next) => setLoanType(Number(next) as LoanType)}
              solid
              styles={styles}
            />

            <View style={styles.group}>
              <View style={[styles.groupRow, styles.groupDivider]}>
                <Text style={styles.groupLabel}>{t("loan.name")}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("loan.namePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.groupInput}
                />
              </View>
              <View style={[styles.groupRow, styles.groupDivider]}>
                <Text style={styles.groupLabel}>{t("loan.principal")}</Text>
                <TextInput
                  value={principalText}
                  onChangeText={setPrincipalText}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={styles.groupInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCalendar("deadline")}
                style={[styles.groupRow, styles.groupDivider]}
              >
                <Text style={styles.groupLabel}>{t("loan.deadlineLabel")}</Text>
                <View style={styles.groupValueWrap}>
                  <Text style={styles.groupValue}>{formatDate(deadline, "D MMM YYYY")}</Text>
                  <Chevron color={colors.textMuted} />
                </View>
              </Pressable>
              <View style={styles.groupRow}>
                <Text style={styles.groupLabel}>{t("loan.purpose")}</Text>
                <TextInput
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder={t("loan.addDetails")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.groupInput}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <FooterButton
                label={t("common.cancel")}
                disabled={busy}
                onPress={onClose}
                styles={styles}
              />
              <FooterButton
                label={t("common.saveChanges")}
                primary
                disabled={busy || !editValid}
                onPress={saveEdit}
                styles={styles}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={confirmDeleteLoan}
              style={styles.deleteLink}
            >
              <Text style={styles.deleteText}>{t("loan.delete")}</Text>
            </Pressable>
          </>
        )}
      </View>
      )}

      <ScalarCalendar
        visible={calendar !== null}
        date={calendar === "deadline" ? deadline : paymentDate}
        title={t(calendar === "deadline" ? "loan.deadline" : "loan.paymentDate")}
        onConfirm={(selected) => {
          if (calendar === "deadline") setDeadline(selected);
          else setPaymentDate(selected);
          setCalendar(null);
        }}
        onCancel={() => setCalendar(null)}
      />
    </BaseBottomSheet>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Segmented({
  options,
  value,
  onChange,
  solid = false,
  styles,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** Filled brand selection (loan direction) instead of a raised pill. */
  solid?: boolean;
  styles: Styles;
}) {
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segmentItem,
              active && (solid ? styles.segmentSolid : styles.segmentRaised),
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                active && (solid ? styles.segmentTextSolid : styles.segmentTextActive),
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FooterButton({
  label,
  onPress,
  primary = false,
  wide = false,
  disabled = false,
  styles,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  wide?: boolean;
  disabled?: boolean;
  styles: Styles;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.footerButton,
        primary ? styles.footerPrimary : styles.footerSecondary,
        { flex: wide ? 1 : primary ? 1.4 : 1 },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={primary ? styles.footerPrimaryText : styles.footerSecondaryText}>
        {label}
      </Text>
    </Pressable>
  );
}

const Chevron = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="chevron-right" size={18} color={color} />
);

type Colors = ReturnType<typeof useAppTheme>["colors"];

/** Sheet surfaces from the Naval redesign, mapped onto theme tokens. */
function makePalette(colors: Colors, isDark: boolean) {
  return {
    card: isDark ? colors.groupBg : colors.cardBg,
    cardBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(45,66,99,0.08)",
    track: isDark ? colors.groupBg : colors.dockActiveBg,
    soft: isDark ? colors.softChipBg : colors.dockActiveBg,
    raised: isDark ? "#2A3040" : colors.cardBg,
    rowDivider: isDark ? "rgba(255,255,255,0.08)" : "rgba(45,66,99,0.10)",
    accent: colors.chipActiveBg,
    onAccent: colors.chipActiveInk,
    negativeWash: isDark ? "rgba(240,98,63,0.14)" : "rgba(200,75,49,0.10)",
  };
}

function makeStyles(colors: Colors, p: ReturnType<typeof makePalette>) {
  return StyleSheet.create({
    root: { gap: 16, paddingTop: 2 },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.45 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerTile: {
      width: 48,
      height: 48,
      borderRadius: 999,
      backgroundColor: p.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1, gap: 2, minWidth: 0 },
    title: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 18,
    },
    meta: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: p.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      borderRadius: 24,
      padding: 18,
      gap: 14,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    cardFigure: { gap: 4, flexShrink: 1 },
    muted13: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    outstanding: {
      color: colors.sheetText,
      fontFamily: designTokens.font.display,
      fontSize: 30,
      letterSpacing: -0.6,
    },
    badge: {
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
    },
    badgeNegative: { color: colors.negative, backgroundColor: p.negativeWash },
    badgeNeutral: { color: colors.sheetText, backgroundColor: p.soft },
    track: {
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: p.soft,
    },
    fill: { height: 8, borderRadius: 999, backgroundColor: p.accent },
    cardFoot: { flexDirection: "row", justifyContent: "space-between" },
    segment: {
      height: 44,
      borderRadius: 999,
      padding: 4,
      gap: 4,
      flexDirection: "row",
      backgroundColor: p.track,
    },
    segmentItem: {
      flex: 1,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentRaised: {
      backgroundColor: p.raised,
      shadowColor: "#2D4263",
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    segmentSolid: { backgroundColor: p.accent },
    segmentText: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    segmentTextActive: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
    },
    segmentTextSolid: {
      color: p.onAccent,
      fontFamily: designTokens.font.semibold,
    },
    entry: { alignItems: "center", gap: 12, paddingTop: 4 },
    entryRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
    entrySymbol: {
      color: colors.textMuted,
      fontFamily: designTokens.font.display,
      fontSize: 26,
    },
    entryInput: {
      minWidth: 60,
      maxWidth: 260,
      padding: 0,
      color: colors.sheetText,
      fontFamily: designTokens.font.display,
      fontSize: 44,
      letterSpacing: -0.9,
      textAlign: "center",
    },
    error: {
      color: colors.negative,
      fontFamily: designTokens.font.medium,
      fontSize: 13,
    },
    picks: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center" },
    pick: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 999,
      justifyContent: "center",
      backgroundColor: p.soft,
    },
    pickActive: { backgroundColor: p.accent },
    pickText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 13,
    },
    pickTextActive: { color: p.onAccent, fontFamily: designTokens.font.semibold },
    group: {
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
    },
    groupRow: {
      minHeight: 52,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    groupDivider: { borderBottomWidth: 1, borderBottomColor: p.rowDivider },
    groupLabel: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
    },
    groupValueWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
    groupValue: {
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 15,
    },
    groupInput: {
      flex: 1,
      paddingVertical: 14,
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 15,
      textAlign: "right",
    },
    history: { gap: 6 },
    historyTitle: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 13,
    },
    historyRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    historyText: { flex: 1, gap: 2 },
    historyAmount: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
    },
    empty: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
    },
    deleteLink: { height: 44, alignItems: "center", justifyContent: "center" },
    deleteText: {
      color: colors.negative,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    footer: { flexDirection: "row", gap: 10, paddingTop: 8 },
    footerButton: {
      height: 54,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    footerPrimary: { backgroundColor: colors.primaryButtonBg },
    footerSecondary: { backgroundColor: p.soft },
    footerPrimaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    footerSecondaryText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
  });
}
