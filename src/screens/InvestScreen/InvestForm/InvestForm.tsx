import {View, Pressable, StyleSheet, Text} from 'react-native';
import React, {Fragment, useMemo, useState} from 'react';
import {useFormikContext} from 'formik';
import {EAddInvestFormFields} from '@trackingPortal/screens/InvestScreen';
import {TextInput} from 'react-native-paper';
import {FormikCheckboxField, FormikTextInput} from '@trackingPortal/components';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';

interface IInvestForm {
  update?: boolean;
}

const InvestForm: React.FC<IInvestForm> = ({update}) => {
  const {values, setFieldValue} = useFormikContext<any>();
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const startDateValue = values[EAddInvestFormFields.START_DATE];
  const endDateValue = values[EAddInvestFormFields.END_DATE];

  const resolveDate = (value: any) => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const startDate = useMemo(
    () => resolveDate(startDateValue),
    [startDateValue],
  );

  const endDate = useMemo(
    () => resolveDate(endDateValue),
    [endDateValue],
  );

  return (
    <View style={styles.formRoot}>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>NAME</Text>
        <FormikTextInput 
          name={EAddInvestFormFields.NAME} 
          placeholder="e.g. S&P 500 Index" 
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>AMOUNT</Text>
        <FormikTextInput
          name={EAddInvestFormFields.AMOUNT}
          placeholder="$ 0.00"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>START DATE</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            mode="flat"
            value={dayjs(startDate).format('DD MMM YYYY')}
            editable={false}
            pointerEvents="none"
            right={<TextInput.Icon icon="calendar-month-outline" color="#5a6069" />}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setStartPickerVisible(true)}
        />
        </View>
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>NOTE</Text>
        <FormikTextInput
          name={EAddInvestFormFields.NOTE}
          placeholder="Additional details..."
          multiline
          numberOfLines={4}
        />
      </View>
      
      <DatePicker
        modal
        mode="date"
        open={startPickerVisible}
        date={startDate}
        theme="dark"
        onConfirm={selectedDate => {
          setFieldValue(EAddInvestFormFields.START_DATE, selectedDate);
          setStartPickerVisible(false);
        }}
        onCancel={() => setStartPickerVisible(false)}
      />

      {update && (
        <Fragment>
          <View style={styles.fieldSection}>
            <Text style={styles.sectionLabel}>END DATE</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                mode="flat"
                value={dayjs(endDate).format('DD MMM YYYY')}
                editable={false}
                pointerEvents="none"
                right={<TextInput.Icon icon="calendar-month-outline" color="#5a6069" />}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={() => setEndPickerVisible(true)}
              />
            </View>
          </View>
          <DatePicker
            modal
            mode="date"
            open={endPickerVisible}
            date={endDate}
            theme="dark"
            onConfirm={selectedDate => {
              setFieldValue(EAddInvestFormFields.END_DATE, selectedDate);
              setEndPickerVisible(false);
            }}
            onCancel={() => setEndPickerVisible(false)}
          />
          <View style={styles.fieldSection}>
            <Text style={styles.sectionLabel}>RETURN (including capital)</Text>
            <FormikTextInput
              name={EAddInvestFormFields.EARNED}
              placeholder="$ 0.00"
              keyboardType="numeric"
            />
          </View>
          <FormikCheckboxField
            label="Mark as COMPLETED"
            name={EAddInvestFormFields.STATUS}
          />
        </Fragment>
      )}
    </View>
  );
};

export default InvestForm;

const styles = StyleSheet.create({
  formRoot: {
    gap: 16,
  },
  fieldSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#8a929a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
