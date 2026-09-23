import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import {
  InvestId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from "@trackingPortal/api/primitives";
import ScalarListRow from "@trackingPortal/components/ScalarListRow";
import { PillChip, ScalarSheet, SheetHeader } from "@trackingPortal/components/scalar";
import { useScalarAlert } from "@trackingPortal/components/ScalarAlert";
import { useOffline } from "@trackingPortal/contexts/OfflineProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import InvestForm from "@trackingPortal/screens/InvestScreen/InvestForm";
import {
  AddInvestSchema,
  EAddInvestFormFields,
} from "@trackingPortal/screens/InvestScreen";
import { designTokens } from "@trackingPortal/themes/designTokens";
import {
  triggerSuccessHaptic,
} from "@trackingPortal/utils/haptic";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import dayjs from "dayjs";
import { Formik } from "formik";
import React, {
  FC,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

interface IInvestList {
  notifyRowOpen: (value: boolean) => void;
  invests: InvestModel[];
  getUserInvestHistory: () => void;
  status: EInvestStatus;
  setStatus: React.Dispatch<SetStateAction<EInvestStatus>>;
}

const InvestList: FC<IInvestList> = ({
  notifyRowOpen,
  invests,
  getUserInvestHistory,
  status,
  setStatus,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expandedRowId, setExpandedRowId] = useState<InvestId | null>(null);
  const { currentUser: user, currency } = useStoreContext();
  const { investData } = useDatabase();
  const { syncNow } = useOffline();
  const showAlert = useScalarAlert();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const onInvestEdit = useCallback(
    async (values: any, { resetForm }: any, id: InvestId) => {
      if (user.default || !investData) return;
      try {
        setLoading(true);
        await investData.updateInvest(id as string, {
          amount: Number(values.amount),
          startDate: makeUnixTimestampString(Number(new Date(values.start_date))),
          note: values.note,
          name: values.name,
          endDate: makeUnixTimestampString(Number(new Date(values.end_date))),
          status: values.status
            ? EInvestStatus.Completed
            : EInvestStatus.Active,
          earned: Number(values.earned),
        });
        await getUserInvestHistory();
        triggerSuccessHaptic();
        Toast.show({
          type: "success",
          text1: "Investment updated successfully!",
        });
        syncNow();
      } catch {
        Toast.show({ type: "error", text1: "Something went wrong!" });
      } finally {
        resetForm();
        setExpandedRowId(null);
        setLoading(false);
      }
    },
    [getUserInvestHistory, investData, syncNow, user.default],
  );

  const handleDelete = useCallback(
    async (id: InvestId) => {
      if (!investData) return;
      try {
        setDeleteLoading(true);
        await investData.deleteInvest(id as string);
        await getUserInvestHistory();
        Toast.show({ type: "success", text1: "Deleted successfully!" });
        syncNow();
      } catch {
        Toast.show({ type: "error", text1: "Something went wrong!" });
      } finally {
        setDeleteLoading(false);
        setExpandedRowId(null);
      }
    },
    [getUserInvestHistory, investData, syncNow],
  );

  const confirmDelete = useCallback(
    (investment: InvestModel) => {
      showAlert({
        title: "Delete investment?",
        message: `Are you sure you want to delete ${investment.name}? This action cannot be undone.`,
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleDelete(investment.id as InvestId),
          },
        ],
      });
    },
    [handleDelete, showAlert],
  );

  const renderEditor = useCallback(
    (item: InvestModel) => (
      <Formik
        enableReinitialize
        initialValues={{
          id: item.id,
          [EAddInvestFormFields.START_DATE]: new Date(
            Number(item.startDate) * 1000,
          ),
          [EAddInvestFormFields.END_DATE]: item.endDate
            ? new Date(Number(item.endDate) * 1000)
            : new Date(),
          [EAddInvestFormFields.NOTE]: item.note || "",
          [EAddInvestFormFields.AMOUNT]: formatNumber(item.amount, {
            useGrouping: false,
            maximumFractionDigits: 2,
          }),
          [EAddInvestFormFields.NAME]: item.name,
          [EAddInvestFormFields.EARNED]:
            item.earned == null
              ? ""
              : formatNumber(item.earned, {
                  useGrouping: false,
                  maximumFractionDigits: 2,
                }),
          [EAddInvestFormFields.STATUS]:
            item.status === EInvestStatus.Completed,
        }}
        onSubmit={(values, helpers) =>
          onInvestEdit(values, helpers, item.id as InvestId)
        }
        validationSchema={AddInvestSchema}
      >
        {({ handleSubmit }) => (
          <View style={styles.editor}>
            <InvestForm
              update
              onSubmit={handleSubmit}
              onCancel={() => setExpandedRowId(null)}
              loading={loading}
            />
            <Pressable
              disabled={deleteLoading}
              onPress={() => confirmDelete(item)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>
                {deleteLoading ? "Deleting…" : "Delete investment"}
              </Text>
            </Pressable>
          </View>
        )}
      </Formik>
    ),
    [confirmDelete, deleteLoading, loading, onInvestEdit, styles],
  );

  const active = status === EInvestStatus.Active;

  return (
    <ScalarSheet>
      <SheetHeader title="Investment history" />
      <View style={styles.filters}>
        <PillChip
          variant="sheet"
          label="Active"
          active={active}
          onPress={() => setStatus(EInvestStatus.Active)}
        />
        <PillChip
          variant="sheet"
          label="Completed"
          active={!active}
          onPress={() => setStatus(EInvestStatus.Completed)}
        />
      </View>
      <View style={styles.card}>
        {invests.length ? (
          invests.map((invest, index) => {
            const completed = invest.status === EInvestStatus.Completed;
            const open = expandedRowId === invest.id;
            const returnLabel =
              invest.earned != null && invest.amount > 0
                ? formatNumber(
                    ((invest.earned - invest.amount) / invest.amount) * 100,
                    { maximumFractionDigits: 1, minimumFractionDigits: 1, suffix: "%" },
                  ).replace("-", "−")
                : undefined;
            return (
              <View key={invest.id}>
                <ScalarListRow
                  title={invest.name}
                  status={returnLabel}
                  meta={`${completed ? "Completed" : "Active"} · since ${dayjs(
                    makeUnixTimestampToNumber(Number(invest.startDate)),
                  ).format("D MMM YYYY")}`}
                  amount={formatCurrency(invest.amount, currency, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  icon={completed ? "check-bold" : "rhombus"}
                  categoryColor={completed ? colors.positiveTile : colors.goldTile}
                  iconGlyphColor={completed ? colors.positive : colors.assetGold}
                  showDivider={index < invests.length - 1 || open}
                  onPress={() => {
                    const next = open ? null : invest.id;
                    setExpandedRowId(next);
                    notifyRowOpen(Boolean(next));
                  }}
                />
                {open && renderEditor(invest)}
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>
            No {active ? "active" : "completed"} investments
          </Text>
        )}
      </View>
      {active && invests.length === 1 && (
        <View style={styles.assetHint}>
          <Text style={styles.assetHintTitle}>One asset tracked</Text>
          <Text style={styles.assetHintText}>Add a second to compare returns over time.</Text>
        </View>
      )}
    </ScalarSheet>
  );
};

export default React.memo(InvestList);

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    filters: { flexDirection: "row", gap: 6, paddingTop: 4, paddingBottom: 6 },
    card: {
      backgroundColor: "transparent",
    },
    editor: { gap: 12, paddingVertical: 16, backgroundColor: "transparent" },
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
    assetHint: {
      marginTop: 8,
      gap: 3,
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: designTokens.radius.group,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.dashedBorder,
    },
    assetHintTitle: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    assetHintText: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
  });
}
