import {View, StyleSheet, TouchableOpacity} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, {
  FC,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {Text} from 'react-native-paper';

import DataTable from '@trackingPortal/components/DataTable';
import {colors} from '@trackingPortal/themes/colors';

import {InvestModel} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {IUpdateInvestParams} from '@trackingPortal/api/params';
import Toast from 'react-native-toast-message';
import {
  AnimatedLoader,
  LoadingButton,
  TwMenu,
} from '@trackingPortal/components';
import dayjs from 'dayjs';
import {
  InvestId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from '@trackingPortal/api/primitives';
import {
  EAddInvestFormFields,
  AddInvestSchema,
  filterInvestByStatusMenu,
} from '@trackingPortal/screens/InvestScreen';
import {Formik} from 'formik';
import InvestForm from '@trackingPortal/screens/InvestScreen/InvestForm';
import {EInvestStatus} from '@trackingPortal/api/enums';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '@trackingPortal/utils/haptic';

interface IInvestList {
  notifyRowOpen: (value: boolean) => void;
  invests: InvestModel[];
  getUserInvestHistory: () => void;
  status: EInvestStatus;
  setStatus: React.Dispatch<SetStateAction<EInvestStatus>>;
}

const headers = ['Date', 'Purpose', 'Amount'];

const tintFromHex = (hex: string, alpha = 0.12) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const InvestList: FC<IInvestList> = ({
  notifyRowOpen,
  invests,
  getUserInvestHistory,
  status,
  setStatus,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<InvestId | null>(null);
  const {currentUser: user, apiGateway, currency} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const onInvestEdit = async (values: any, {resetForm}: any, id: InvestId) => {
    if (user.default) return;

    try {
      setLoading(true);
      const params: IUpdateInvestParams = {
        id: id,
        amount: Number(values.amount),
        startDate: makeUnixTimestampString(Number(new Date(values.start_date))),
        note: values.note,
        name: values.name,
        endDate: makeUnixTimestampString(Number(new Date(values.end_date))),
        status:
          values.status === true
            ? EInvestStatus.Completed
            : EInvestStatus.Active,
        earned: Number(values.earned),
      };

      await apiGateway.investService.updateInvest(params);
      await getUserInvestHistory();
      triggerSuccessHaptic();
      Toast.show({
        type: 'success',
        text1: 'Investment updated successfully!',
      });
    } catch (error) {
      console.log('error', error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
      });
    } finally {
      resetForm();
      setExpandedRowId(null);
      setLoading(false);
    }
  };

  const handleDeleteInvestment = async (rowId: any) => {
    if (!rowId) return;
    try {
      setDeleteLoading(true);
      await apiGateway.investService.deleteInvest(rowId);
      await getUserInvestHistory();
      triggerWarningHaptic();
      Toast.show({
        type: 'success',
        text1: 'Deleted Successfully!',
      });
    } catch (error) {
      console.log('error', error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
      });
    } finally {
      setDeleteLoading(false);
      setExpandedRowId(null);
    }
  };

  const renderCollapsibleContent = useCallback(
    (item: InvestModel) => {
      const selectedItem = invests.find(invest => invest.id === item.id);
      if (!selectedItem) return null;
      const currentRowId = selectedItem.id;

      return (
        <Formik
          enableReinitialize={true}
          initialValues={{
            id: selectedItem.id,
            [EAddInvestFormFields.START_DATE]: new Date(
              Number(selectedItem.startDate) * 1000,
            ),
            [EAddInvestFormFields.END_DATE]: selectedItem.endDate
              ? new Date(Number(selectedItem.endDate) * 1000)
              : new Date(),
            [EAddInvestFormFields.NOTE]: selectedItem.note || '',
            [EAddInvestFormFields.AMOUNT]: formatNumber(selectedItem.amount, {
              useGrouping: false,
              maximumFractionDigits: 2,
            }),
            [EAddInvestFormFields.NAME]: selectedItem.name,
            [EAddInvestFormFields.EARNED]:
              selectedItem.earned !== undefined &&
              selectedItem.earned !== null
                ? formatNumber(selectedItem.earned, {
                    useGrouping: false,
                    maximumFractionDigits: 2,
                  })
                : '',
            [EAddInvestFormFields.STATUS]:
              item.status === EInvestStatus.Active ? false : true,
          }}
          onSubmit={(values, formikHelpers) =>
            onInvestEdit(values, formikHelpers, currentRowId)
          }
          validationSchema={AddInvestSchema}>
          {({handleSubmit}) => {
            return (
              <View style={styles.collapsibleContent}>
                <InvestForm
                  update
                  onSubmit={handleSubmit}
                  onCancel={() => setExpandedRowId(null)}
                  loading={loading}
                />
              </View>
            );
          }}
        </Formik>
      );
    },
    [invests, setExpandedRowId, onInvestEdit, loading],
  );

  const getProfit = (capital: number, totalEarned: number | null) => {
    if (!totalEarned || capital === 0) return 'N/A';
    const profit = totalEarned - capital;
    const profitPercentage = (profit / capital) * 100;
    return formatNumber(profitPercentage, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      suffix: '%',
    });
  };

  const tableData = useMemo(
    () =>
      invests.map(invest => {
        const profitLabel =
          invest.status === EInvestStatus.Completed
            ? getProfit(invest.amount, invest.earned ?? null)
            : null;
        const statusLabel =
          invest.status === EInvestStatus.Completed ? 'MATURED' : 'ACTIVE';
        const categoryName =
          profitLabel && profitLabel !== 'N/A'
            ? `${statusLabel} • ${profitLabel}`
            : statusLabel;
        const palette =
          invest.status === EInvestStatus.Completed
            ? {color: '#b6f700', icon: 'check-circle-outline'}
            : {color: '#8cafff', icon: 'timeline-clock-outline'};

        return {
          id: invest.id,
          Date: dayjs(
            makeUnixTimestampToNumber(Number(invest.startDate)),
          ).format('MMM D, YYYY'),
          Purpose: invest.name,
          Amount: invest.amount,
          DisplayAmount: formatCurrency(invest.amount, currency),
          CategoryName: categoryName,
          CategoryColor: palette.color,
          IconName: palette.icon,
          IconColor: palette.color,
          IconBackground: tintFromHex(palette.color, 0.16),
        };
      }),
    [invests, currency],
  );

  if (deleteLoading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.listCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={colors.primary} />
              <Text style={styles.title}>Investment History</Text>
            </View>
            <Text style={styles.subtitle}>
              Monitor allocations, returns, and close out wins.
            </Text>
          </View>
          <TwMenu
            containerStyle={styles.menuContainer}
            onSelect={value => {
              setStatus(value);
            }}
            buttonStyle={styles.statusButton}
            buttonLabel={
              filterInvestByStatusMenu.find(item => item.value === status)
                ?.label || 'Status'
            }
            options={filterInvestByStatusMenu}
          />
        </View>

        <View style={styles.tableContainer}>
          <DataTable
            headers={headers}
            data={tableData}
            onDelete={handleDeleteInvestment}
            isAnyRowOpen={notifyRowOpen}
            expandedRowId={expandedRowId}
            setExpandedRowId={setExpandedRowId}
            renderCollapsibleContent={renderCollapsibleContent}
          />
        </View>
      </View>
    </View>
  );
};

export default React.memo(InvestList);

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listCard: {
    marginTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Manrope',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.subText,
    fontSize: 13,
    fontFamily: 'Manrope',
    lineHeight: 18,
    maxWidth: 240,
  },
  tableContainer: {
    marginTop: 0,
  },
  collapsibleContent: {
    gap: 16,
    paddingBottom: 20,
  },
  menuContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  cancelButtonText: {
    color: colors.subText,
    fontWeight: '600',
  },
});
