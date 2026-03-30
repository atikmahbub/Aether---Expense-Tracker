
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

interface IInvestCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  getUserInvestHistory: () => void;
}

const InvestCreation: React.FC<IInvestCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  getUserInvestHistory,
}) => {
  const {apiGateway} = useStoreContext();
  const {currentUser: user} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);


  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddInvestment = async (values: INewInvest) => {
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
      await apiGateway.investService.addInvest(params);
      
      handleClose();
      
      requestAnimationFrame(async () => {
        await getUserInvestHistory();
        triggerSuccessHaptic();
        Toast.show({
          type: 'success',
          text1: 'Investment added successfully',
        });
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
      });
    } finally {
      setLoading(false);
    }
  };

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
