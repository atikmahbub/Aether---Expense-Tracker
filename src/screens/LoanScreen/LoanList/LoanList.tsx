import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import { makeUnixTimestampToNumber } from "@trackingPortal/api/primitives";
import ScalarListRow from "@trackingPortal/components/ScalarListRow";
import { ScalarSheet, SheetHeader } from "@trackingPortal/components/scalar";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import type { LoanPaymentView } from "@trackingPortal/db/services/LoanDataService";
import LoanDetailSheet from "@trackingPortal/screens/LoanScreen/LoanDetailSheet";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { formatCurrency } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import React, { FC, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ILoanList {
  notifyRowOpen: (value: boolean) => void;
  loans: LoanModel[];
  /** Payments keyed by local loan id. */
  paymentsByLoan: Record<string, LoanPaymentView[]>;
  getUserLoan: () => Promise<void> | void;
}

/** What is still owed on a loan, never below zero. */
export const remainingFor = (loan: LoanModel, payments: LoanPaymentView[] = []) =>
  Math.max(
    Math.round((loan.amount - payments.reduce((sum, p) => sum + p.amount, 0)) * 100) / 100,
    0,
  );

const NO_PAYMENTS: LoanPaymentView[] = [];

const LoanList: FC<ILoanList> = ({
  notifyRowOpen,
  loans,
  paymentsByLoan,
  getUserLoan,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { currency } = useStoreContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const openLoans = useMemo(() => loans.filter((l) => !l.settledAt), [loans]);
  const settledLoans = useMemo(() => loans.filter((l) => l.settledAt), [loans]);
  // Looked up from the live list so the sheet reflects every write.
  const selectedLoan = loans.find((l) => l.id === selectedId) ?? null;

  const select = (id: string | null) => {
    setSelectedId(id);
    notifyRowOpen(Boolean(id));
  };

  const fmt = (value: number) =>
    formatCurrency(value, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const renderLoan = (loan: LoanModel, index: number, list: LoanModel[]) => {
    const given = loan.loanType === LoanType.GIVEN;
    const settled = Boolean(loan.settledAt);
    const payments = paymentsByLoan[loan.id] ?? NO_PAYMENTS;
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = remainingFor(loan, payments);
    const last = index === list.length - 1;
    const overdue =
      !settled &&
      Boolean(loan.deadLine) &&
      dayjs(makeUnixTimestampToNumber(Number(loan.deadLine))).isBefore(dayjs(), "day");
    const meta = settled
      ? `${given ? "Given" : "Borrowed"} · settled ${dayjs(
          makeUnixTimestampToNumber(Number(loan.settledAt)),
        ).format("D MMM YYYY")}`
      : `${given ? "Given" : "Borrowed"}${
          paid > 0 ? ` · ${fmt(paid)} of ${fmt(loan.amount)} paid` : ""
        } · due ${dayjs(makeUnixTimestampToNumber(Number(loan.deadLine))).format("D MMM YYYY")}`;
    const showProgress = !settled && paid > 0;

    return (
      <View key={loan.id} style={showProgress && !last && styles.rowDivider}>
        <ScalarListRow
          grouped
          title={loan.name}
          meta={meta}
          // Open loans show what is still owed; settled ones show the original.
          amount={`${given ? "+" : "−"}${fmt(settled ? loan.amount : remaining)}`}
          positive={given && !settled}
          negative={!given && !settled}
          icon={settled ? "check" : given ? "arrow-top-right" : "arrow-bottom-left"}
          categoryColor={
            settled ? colors.softChipBg : given ? colors.positiveTile : colors.negativeTile
          }
          iconGlyphColor={
            settled ? colors.textMuted : given ? colors.positive : colors.negative
          }
          status={settled ? "Settled" : overdue ? "Overdue" : paid > 0 ? "Left" : "Open"}
          // With a progress bar the divider moves below it (rowDivider).
          showDivider={!last && !showProgress}
          onPress={() => select(loan.id)}
        />
        {showProgress && (
          <View
            style={styles.progressTrack}
            accessibilityLabel={`${Math.round((paid / loan.amount) * 100)}% repaid`}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((paid / loan.amount) * 100, 100)}%`,
                  backgroundColor: given ? colors.positive : colors.negative,
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <ScalarSheet>
      <SheetHeader title="Loan history" />
      {openLoans.length ? (
        <View style={styles.card}>{openLoans.map(renderLoan)}</View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>
            {loans.length ? "All loans are settled" : "No loan entries yet"}
          </Text>
        </View>
      )}
      {settledLoans.length > 0 && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: historyOpen }}
            onPress={() => setHistoryOpen((v) => !v)}
            style={styles.historyHeader}
          >
            <Text style={styles.historyTitle}>Settled ({settledLoans.length})</Text>
            <MaterialCommunityIcons
              name={historyOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
          {historyOpen && (
            <View style={styles.card}>{settledLoans.map(renderLoan)}</View>
          )}
        </View>
      )}
      <LoanDetailSheet
        loan={selectedLoan}
        payments={selectedLoan ? paymentsByLoan[selectedLoan.id] ?? NO_PAYMENTS : NO_PAYMENTS}
        onClose={() => select(null)}
        onChanged={getUserLoan}
      />
    </ScalarSheet>
  );
};

export default React.memo(LoanList);

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    // Same grouped card and empty state as the wallet timeline rows.
    card: {
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      borderRadius: designTokens.radius.group,
      backgroundColor: colors.listCardBg,
    },
    emptyCard: {
      padding: 18,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.dashedBorder,
      borderRadius: designTokens.radius.group,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.rowDivider,
    },
    progressTrack: {
      height: 4,
      // Aligned under the title: row padding 14 + tile 44 + gap 14.
      marginLeft: 72,
      marginRight: 14,
      marginBottom: 12,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: colors.chartEmpty,
    },
    progressFill: { height: 4, borderRadius: 999 },
    historyHeader: {
      minHeight: 44,
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    historyTitle: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    empty: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      textAlign: "center",
      ...designTokens.typography.body,
    },
  });
}
