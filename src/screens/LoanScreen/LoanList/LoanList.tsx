import {View, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC, Fragment, useCallback, useState} from 'react';
import {Text} from 'react-native-paper';

import DataTable from '@trackingPortal/components/DataTable';
import {colors} from '@trackingPortal/themes/colors';

import {LoanModel} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {IUpdateLoanParams} from '@trackingPortal/api/params';
import Toast from 'react-native-toast-message';
import {AnimatedLoader, LoadingButton} from '@trackingPortal/components';
import {LoanType} from '@trackingPortal/api/enums';
import dayjs from 'dayjs';
import {
  LoanId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from '@trackingPortal/api/primitives';
import {
  AddLoanSchema,
  EAddLoanFields,
} from '@trackingPortal/screens/LoanScreen/LoanScreen.constants';
import {Formik} from 'formik';
import LoanForm from '@trackingPortal/screens/LoanScreen/LoanForm';
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '@trackingPortal/utils/haptic';

interface ILoanList {
  notifyRowOpen: (value: boolean) => void;
  loans: LoanModel[];
  getUserLoan: () => void;
}

const headers = ['Name', 'Type', 'Deadline', 'Amount'];

const LoanList: FC<ILoanList> = ({notifyRowOpen, loans, getUserLoan}) => {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const {currentUser: user, apiGateway} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const onLoanEdit = async (values: any, {resetForm}: any, id: LoanId) => {
    if (user.default) return;

    try {
      setLoading(true);
      const params: IUpdateLoanParams = {
        id: id,
        amount: Number(values.amount),
        deadLine: makeUnixTimestampString(Number(new Date(values.deadLine))),
        note: values.note,
        name: values.name,
      };

      await apiGateway.loanServices.updateLoan(params);
      await getUserLoan();
      triggerSuccessHaptic();
      Toast.show({
        type: 'success',
        text1: 'Loan updated successfully!',
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

  const handleDeleteLoan = async (rowId: any) => {
    if (!rowId) return;
    try {
      setDeleteLoading(true);
      await apiGateway.loanServices.deleteLoan(rowId);
      await getUserLoan();
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
    (item: LoanModel) => {
      const selectedItem = loans.find(loan => loan.id === item.id);
      if (!selectedItem) return null;
      const currentRowId = selectedItem.id;

      return (
        <Formik
          enableReinitialize
          initialValues={{
            id: selectedItem.id,
            [EAddLoanFields.DEADLINE]: new Date(
              Number(selectedItem.deadLine) * 1000,
            ),
            [EAddLoanFields.NOTE]: selectedItem.note || '',
            [EAddLoanFields.AMOUNT]: selectedItem.amount.toString(),
            [EAddLoanFields.NAME]: selectedItem.name,
          }}
          onSubmit={(values, formikHelpers) =>
            onLoanEdit(values, formikHelpers, currentRowId)
          }
          validationSchema={AddLoanSchema}>
          {({handleSubmit}) => (
            <Fragment>
              <LoanForm />
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => !loading && setExpandedRowId(null)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <LoadingButton
                  label="Save"
                  loading={loading}
                  onPress={() => handleSubmit()}
                />
              </View>
            </Fragment>
          )}
        </Formik>
      );
    },
    [loans, setExpandedRowId],
  );

  if (deleteLoading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.listCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Loan History</Text>
        </View>
        <View style={styles.tableContainer}>
          <DataTable
            headers={headers}
            data={loans.map(loan => ({
              id: loan.id,
              Type: loan.loanType === LoanType.GIVEN ? 'Given' : 'Taken',
              Name: loan.name,
              Deadline: `Due: ${dayjs(makeUnixTimestampToNumber(Number(loan.deadLine))).format('MMM DD, YYYY')}`,
              Amount: loan.amount,
              Avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${loan.name.replace(/\s+/g, '')}&backgroundColor=transparent`,
            }))}
            onDelete={handleDeleteLoan}
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

export default LoanList;

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listCard: {
    marginTop: 12,
    marginHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tableContainer: {
    marginTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingBottom: 20,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cancelButtonText: {
    color: colors.subText,
    fontWeight: '600',
  },
});
