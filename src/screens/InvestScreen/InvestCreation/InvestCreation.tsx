
import { Formik } from 'formik';
import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { makeUnixTimestampString } from '@trackingPortal/api/primitives';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
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
import { EInvestStatus } from '@trackingPortal/api/enums';

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
  const {currentUser: user} = useStoreContext();
  const {investData} = useDatabase();
  const {syncNow} = useOffline();
  const [loading, setLoading] = useState<boolean>(false);


  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddInvestment = useCallback(async (values: INewInvest) => {
    if (!user.userId || !investData) return;

    try {
      setLoading(true);
      const startDate = makeUnixTimestampString(
        Number(new Date(Number(values.start_date))),
      );

      // Offline-first: write to SQLite immediately (works online or offline).
      const newInvest = await investData.createInvest({
        userId: user.userId,
        name: values.name,
        amount: Number(values.amount),
        note: values.note,
        startDate,
      });

      setInvests(prev => [newInvest, ...prev]);
      handleClose();

      requestAnimationFrame(async () => {
        await getUserInvestHistory();
        triggerSuccessHaptic();
        Toast.show({
          type: 'success',
          text1: 'Investment added successfully',
        });
        syncNow();
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
  }, [user.userId, investData, handleClose, setInvests, getUserInvestHistory, syncNow]);

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
