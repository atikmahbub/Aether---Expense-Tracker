
import { Formik } from 'formik';
import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IAddInvestParams } from '@trackingPortal/api/params';
import { makeUnixTimestampString } from '@trackingPortal/api/primitives';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import {
  AddInvestSchema,
  EAddInvestFormFields,
  INewInvest,
} from '@trackingPortal/screens/InvestScreen';
import InvestForm from '@trackingPortal/screens/InvestScreen/InvestForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import Toast from 'react-native-toast-message';

import { InvestModel } from '@trackingPortal/api/models';

interface IInvestCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  setInvests: React.Dispatch<SetStateAction<InvestModel[]>>;
  getUserInvestHistory: () => void;
}

const InvestCreation: React.FC<IInvestCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  setInvests,
  getUserInvestHistory,
}) => {
  const {apiGateway} = useStoreContext();
  const {currentUser: user} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);


  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddInvestment = useCallback(async (values: INewInvest) => {
    if (!user.userId) return;
    try {
      setLoading(true);
      const params: IAddInvestParams = {
        userId: user.userId,
        name: values.name,
        amount: Number(values.amount),
        startDate: makeUnixTimestampString(
          Number(new Date(Number(values.start_date))),
        ),
        note: values.note,
      };
      
      const newInvest = await apiGateway.investService.addInvest(params);
      
      // ✅ OPTIMISTIC UI (Option A)
      setInvests(prev => [newInvest, ...prev]);

      handleClose();

      // 1. Schedule full refresh & feedback
      requestAnimationFrame(async () => {
        await getUserInvestHistory();
        triggerSuccessHaptic();

        Toast.show({
          type: 'success',
          text1: 'Investment added successfully',
        });
      });
    } catch (error) {
      console.error('Investment Creation Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add investment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [user.userId, apiGateway.investService, handleClose, setInvests, getUserInvestHistory]);

  return (
    <BaseBottomSheet
      index={openCreationModal ? 1 : -1}
      onClose={handleClose}>
      <Formik
        initialValues={{
          [EAddInvestFormFields.START_DATE]: new Date(),
          [EAddInvestFormFields.NOTE]: '',
          [EAddInvestFormFields.AMOUNT]: '',
          [EAddInvestFormFields.NAME]: '',
        }}
        onSubmit={handleAddInvestment}
        validationSchema={AddInvestSchema}>
        {({handleSubmit}) => {
          return (
            <View style={styles.container}>
              <InvestForm
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

export default React.memo(InvestCreation);
