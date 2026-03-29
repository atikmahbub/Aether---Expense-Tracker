import {View} from 'react-native';
import React, {SetStateAction, useState} from 'react';
import FormModal from '@trackingPortal/components/FormModal';
import {Formik} from 'formik';

import {
  EAddLoanFields,
  AddLoanSchema,
  INewLoan,
} from '@trackingPortal/screens/LoanScreen';
import LoanForm from '@trackingPortal/screens/LoanScreen/LoanForm';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {makeUnixTimestampString} from '@trackingPortal/api/primitives';
import Toast from 'react-native-toast-message';
import {LoanType} from '@trackingPortal/api/enums';
import {IAddLoanParams} from '@trackingPortal/api/params';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';

interface ILoanCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  getUserLoans: () => void;
}

const LoanCreation: React.FC<ILoanCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  getUserLoans,
}) => {
  const {apiGateway} = useStoreContext();
  const {currentUser: user} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddExpense = async (values: INewLoan) => {
    if (!user.userId) return;
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
      await apiGateway.loanServices.addLoan(params);
      await getUserLoans();
      triggerSuccessHaptic();
      Toast.show({
        type: 'success',
        text1: 'Loan added successfully',
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
        [EAddLoanFields.DEADLINE]: new Date(),
        [EAddLoanFields.NOTE]: '',
        [EAddLoanFields.AMOUNT]: '',
        [EAddLoanFields.NAME]: '',
        [EAddLoanFields.LOAN_TYPE]: LoanType.GIVEN,
      }}
      onSubmit={handleAddExpense}
      validationSchema={AddLoanSchema}>
      {({resetForm, handleSubmit}) => {
        return (
          <View>
            <FormModal
              title="New Entry"
              isVisible={openCreationModal}
              onClose={() => {
                setOpenCreationModal(false);
                resetForm();
              }}
              onSave={handleSubmit}
              children={<LoanForm />}
              loading={loading}
            />
          </View>
        );
      }}
    </Formik>
  );
};

export default LoanCreation;
