
import { Formik } from 'formik';
import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IAddInvestParams } from '@trackingPortal/api/params';
import { makeUnixTimestampString, InvestId, UserId } from '@trackingPortal/api/primitives';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useNetwork } from '@trackingPortal/contexts/NetworkProvider';
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
  const {apiGateway} = useStoreContext();
  const {currentUser: user} = useStoreContext();
  const {isOnline, saveOffline} = useOffline();
  const [loading, setLoading] = useState<boolean>(false);


  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddInvestment = useCallback(async (values: INewInvest) => {
    if (!user.userId) return;

    if (!isOnline) {
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
        const offlineItem = await saveOffline('invest', params);

        // ✅ Optimistic update
        const mockInvest: InvestModel = {
          id: offlineItem.id as unknown as InvestId,
          name: values.name,
          amount: Number(values.amount),
          note: values.note,
          startDate: params.startDate,
          endDate: null,
          status: EInvestStatus.Active,
          earned: 0,
          created: makeUnixTimestampString(Date.now()),
          updated: makeUnixTimestampString(Date.now()),
        };

        setInvests(prev => [mockInvest, ...prev]);
        handleClose();
        return;
      } catch (error) {
        console.error('Offline Investment Error:', error);
      } finally {
        setLoading(false);
      }
    }

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
  }, [user.userId, apiGateway.investService, handleClose, setInvests, getUserInvestHistory, isOnline, saveOffline]);

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
