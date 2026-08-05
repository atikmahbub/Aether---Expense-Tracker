import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import {
  LoanId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from "@trackingPortal/api/primitives";
import ScalarListRow from "@trackingPortal/components/ScalarListRow";
import { useScalarAlert } from "@trackingPortal/components/ScalarAlert";
import { useOffline } from "@trackingPortal/contexts/OfflineProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import LoanForm from "@trackingPortal/screens/LoanScreen/LoanForm";
import {
  AddLoanSchema,
  EAddLoanFields,
} from "@trackingPortal/screens/LoanScreen/LoanScreen.constants";
import { designTokens } from "@trackingPortal/themes/designTokens";
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from "@trackingPortal/utils/haptic";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import { Formik } from "formik";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

interface ILoanList {
  notifyRowOpen: (value: boolean) => void;
  loans: LoanModel[];
  getUserLoan: () => void;
}

const LoanList: FC<ILoanList> = ({ notifyRowOpen, loans, getUserLoan }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const { currentUser: user, currency } = useStoreContext();
  const { loanData } = useDatabase();
  const { syncNow } = useOffline();
  const showAlert = useScalarAlert();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const onLoanEdit = useCallback(
    async (values: any, { resetForm }: any, id: LoanId) => {
      if (user.default || !loanData) return;
      try {
        setLoading(true);
        await loanData.updateLoan(id as string, {
          amount: Number(values.amount),
          deadLine: makeUnixTimestampString(Number(new Date(values.deadLine))),
          note: values.note,
          name: values.name,
        });
        await getUserLoan();
        triggerSuccessHaptic();
        Toast.show({ type: "success", text1: "Loan updated successfully!" });
        syncNow();
      } catch {
        Toast.show({ type: "error", text1: "Something went wrong!" });
      } finally {
        resetForm();
        setExpandedRowId(null);
        setLoading(false);
      }
    },
    [getUserLoan, loanData, syncNow, user.default],
  );

  const handleDeleteLoan = useCallback(
    async (rowId: string) => {
      if (!loanData) return;
      try {
        setDeleteLoading(true);
        await loanData.deleteLoan(rowId);
        await getUserLoan();
        triggerWarningHaptic();
        Toast.show({ type: "success", text1: "Deleted successfully!" });
        syncNow();
      } catch {
        Toast.show({ type: "error", text1: "Something went wrong!" });
      } finally {
        setDeleteLoading(false);
        setExpandedRowId(null);
      }
    },
    [getUserLoan, loanData, syncNow],
  );

  const confirmDeleteLoan = useCallback(
    (loan: LoanModel) => {
      showAlert({
        title: "Delete loan?",
        message: `Are you sure you want to delete the loan with ${loan.name}? This action cannot be undone.`,
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleDeleteLoan(loan.id),
          },
        ],
      });
    },
    [handleDeleteLoan, showAlert],
  );

  const renderEditor = useCallback(
    (item: LoanModel) => (
      <Formik
        enableReinitialize
        initialValues={{
          id: item.id,
          [EAddLoanFields.DEADLINE]: new Date(Number(item.deadLine) * 1000),
          [EAddLoanFields.NOTE]: item.note || "",
          [EAddLoanFields.AMOUNT]: formatNumber(item.amount, {
            useGrouping: false,
            maximumFractionDigits: 2,
          }),
          [EAddLoanFields.NAME]: item.name,
        }}
        onSubmit={(values, helpers) =>
          onLoanEdit(values, helpers, item.id as LoanId)
        }
        validationSchema={AddLoanSchema}
      >
        {({ handleSubmit }) => (
          <View style={styles.editor}>
            <LoanForm
              onSubmit={handleSubmit}
              onCancel={() => setExpandedRowId(null)}
              loading={loading}
            />
            <Pressable
              disabled={deleteLoading}
              onPress={() => confirmDeleteLoan(item)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>
                {deleteLoading ? "Deleting…" : "Delete loan"}
              </Text>
            </Pressable>
          </View>
        )}
      </Formik>
    ),
    [confirmDeleteLoan, deleteLoading, loading, onLoanEdit, styles],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loan History</Text>
      <View style={styles.card}>
        {loans.length ? (
          loans.map((loan, index) => {
            const given = loan.loanType === LoanType.GIVEN;
            const open = expandedRowId === loan.id;
            return (
              <View key={loan.id}>
                <ScalarListRow
                  title={loan.name}
                  meta={`${given ? "Given" : "Borrowed"} · due ${dayjs(
                    makeUnixTimestampToNumber(Number(loan.deadLine)),
                  ).format("D MMM YYYY")}`}
                  amount={`${given ? "+" : "−"}${formatCurrency(
                    loan.amount,
                    currency,
                    { minimumFractionDigits: 0, maximumFractionDigits: 0 },
                  )}`}
                  positive={given}
                  negative={!given}
                  icon={given ? "arrow-top-right" : "arrow-bottom-left"}
                  categoryColor={given ? colors.positive : colors.warning}
                  showDivider={index < loans.length - 1 || open}
                  onPress={() => {
                    const next = open ? null : loan.id;
                    setExpandedRowId(next);
                    notifyRowOpen(Boolean(next));
                  }}
                />
                {open && renderEditor(loan)}
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>No loan entries yet</Text>
        )}
      </View>
    </View>
  );
};

export default React.memo(LoanList);

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 28, gap: 12 },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.section,
    },
    card: {
      gap: 8,
      backgroundColor: "transparent",
    },
    editor: { gap: 12, padding: 16, backgroundColor: colors.bg },
    deleteButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1.5,
      borderColor: colors.negative,
    },
    deleteText: {
      color: colors.negative,
      fontFamily: designTokens.font.bold,
      fontSize: 15,
      fontWeight: "700",
    },
    empty: {
      padding: 20,
      textAlign: "center",
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
    },
  });
}
