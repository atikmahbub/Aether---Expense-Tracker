import {View} from 'react-native';
import React, {SetStateAction, useState} from 'react';
import FormModal from '@trackingPortal/components/FormModal';
import {Formik} from 'formik';

import {
  INewInvest,
  EAddInvestFormFields,
  AddInvestSchema,
} from '@trackingPortal/screens/InvestScreen';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {makeUnixTimestampString} from '@trackingPortal/api/primitives';
import Toast from 'react-native-toast-message';
import {IAddInvestParams} from '@trackingPortal/api/params';
import InvestForm from '@trackingPortal/screens/InvestScreen/InvestForm';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';

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
      await getUserInvestHistory();
      triggerSuccessHaptic();
      Toast.show({
        type: 'success',
        text1: 'Investment added successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
      });
    } finally {
      setLoading(false);
      setOpenCreationModal(false);
    }
  };

  return (
    <Formik
      initialValues={{
        [EAddInvestFormFields.START_DATE]: new Date(),
        [EAddInvestFormFields.NOTE]: '',
        [EAddInvestFormFields.AMOUNT]: '',
        [EAddInvestFormFields.NAME]: '',
      }}
      onSubmit={handleAddInvestment}
      validationSchema={AddInvestSchema}>
      {({resetForm, handleSubmit}) => {
        return (
          <View>
            <FormModal
              title="Add a new Investment"
              subtitle="Expansion of your financial sanctuary."
              saveLabel="Save Investment"
              isVisible={openCreationModal}
              onClose={() => {
                setOpenCreationModal(false);
                resetForm();
              }}
              onSave={handleSubmit}
              children={<InvestForm />}
              loading={loading}
            />
          </View>
        );
      }}
    </Formik>
  );
};

export default InvestCreation;
