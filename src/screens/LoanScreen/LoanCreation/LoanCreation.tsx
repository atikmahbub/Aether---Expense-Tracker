import { Formik } from 'formik';
import React, { SetStateAction, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoanType } from '@trackingPortal/api/enums';
import { LoanModel } from '@trackingPortal/api/models';
import { LoanId, makeUnixTimestampString, UserId } from '@trackingPortal/api/primitives';
import { IAddLoanParams } from '@trackingPortal/api/params';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useNetwork } from '@trackingPortal/contexts/NetworkProvider';
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
  const {apiGateway} = useStoreContext();
  const {currentUser: user} = useStoreContext();
  const {isOnline, saveOffline} = useOffline();
  const [loading, setLoading] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddLoan = useCallback(async (values: INewLoan) => {
    if (!user.userId) return;

    if (!isOnline) {
      try {
        setLoading(true);
        const params: IAddLoanParams = {
          userId: user.userId,
          name: values.name,
          amount: Number(values.amount),
          deadLine: makeUnixTimestampString(
            Number(new Date(Number(values.deadLine))),
          ),
          loanType: values.loan_type,
          note: values.note,
        };
        const offlineItem = await saveOffline('loan', params);

        // ✅ Optimistic update
        const mockLoan: LoanModel = {
          id: offlineItem.id as unknown as LoanId,
          userId: user.userId as UserId,
          name: values.name,
          amount: Number(values.amount),
          note: values.note,
          deadLine: params.deadLine,
          loanType: values.loan_type,
          created: makeUnixTimestampString(Date.now()),
          updated: makeUnixTimestampString(Date.now()),
        };

        setLoans(prev => [mockLoan, ...prev]);
        handleClose();
        return;
      } catch (error) {
        console.error('Offline Loan Error:', error);
      } finally {
        setLoading(false);
      }
    }

    try {
      setLoading(true);
      const params: IAddLoanParams = {
        userId: user.userId,
        name: values.name,
        amount: Number(values.amount),
        deadLine: makeUnixTimestampString(
          Number(new Date(Number(values.deadLine))),
        ),
        loanType: values.loan_type,
        note: values.note,
      };
      
      const newLoan = await apiGateway.loanServices.addLoan(params);
      
      // ✅ OPTIMISTIC UI (Option A)
      setLoans(prev => [newLoan, ...prev]);

      handleClose();

      // 1. Schedule full refresh & feedback
      requestAnimationFrame(async () => {
        await getUserLoans();
        triggerSuccessHaptic();

        Toast.show({
          type: 'success',
          text1: 'Loan added successfully',
        });
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
  }, [user.userId, apiGateway.loanServices, handleClose, setLoans, getUserLoans, isOnline, saveOffline]);

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
