import { Formik } from 'formik';
import React, { SetStateAction, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoanType } from '@trackingPortal/api/enums';
import { LoanModel } from '@trackingPortal/api/models';
import { makeUnixTimestampString } from '@trackingPortal/api/primitives';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import {
  AddLoanSchema,
  EAddLoanFields,
  INewLoan,
} from '@trackingPortal/screens/LoanScreen';
import LoanForm from '@trackingPortal/screens/LoanScreen/LoanForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import Toast from 'react-native-toast-message';

interface ILoanCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  setLoans: React.Dispatch<SetStateAction<LoanModel[]>>;
  getUserLoans: () => void;
}
const LoanCreation: React.FC<ILoanCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  setLoans,
  getUserLoans,
}) => {
  const {currentUser: user} = useStoreContext();
  const {loanData} = useDatabase();
  const {syncNow} = useOffline();
  const [loading, setLoading] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddLoan = useCallback(async (values: INewLoan) => {
    if (!user.userId || !loanData) return;

    try {
      setLoading(true);
      const deadLine = makeUnixTimestampString(
        Number(new Date(Number(values.deadLine))),
      );

      // Offline-first: write to SQLite immediately (works online or offline).
      const newLoan = await loanData.createLoan({
        userId: user.userId,
        name: values.name,
        amount: Number(values.amount),
        note: values.note,
        deadLine,
        loanType: values.loan_type,
      });

      setLoans(prev => [newLoan, ...prev]);
      handleClose();

      requestAnimationFrame(async () => {
        await getUserLoans();
        triggerSuccessHaptic();
        Toast.show({
          type: 'success',
          text1: 'Loan added successfully',
        });
        syncNow();
      });
    } catch (error) {
      console.error('Loan Creation Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add loan. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [user.userId, loanData, handleClose, setLoans, getUserLoans, syncNow]);

  return (
    <BaseBottomSheet
      index={openCreationModal ? 1 : -1}
      onClose={handleClose}>
      <Formik
        initialValues={{
          [EAddLoanFields.DEADLINE]: new Date(),
          [EAddLoanFields.NOTE]: '',
          [EAddLoanFields.AMOUNT]: '',
          [EAddLoanFields.NAME]: '',
          [EAddLoanFields.LOAN_TYPE]: LoanType.GIVEN,
        }}
        onSubmit={handleAddLoan}
        validationSchema={AddLoanSchema}>
        {({handleSubmit}) => {
          return (
            <View style={styles.container}>
              <LoanForm
                onSubmit={handleSubmit}
                onCancel={handleClose}
                loading={loading}
              />
            </View>
          );
        }}
      </Formik>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default React.memo(LoanCreation);
