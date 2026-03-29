import {View, Pressable, StyleSheet, Text, TouchableOpacity, InteractionManager} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useFormikContext} from 'formik';
import {EAddLoanFields} from '@trackingPortal/screens/LoanScreen';
import {TextInput} from 'react-native-paper';
import {FormikTextInput} from '@trackingPortal/components';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';
import {LoanType} from '@trackingPortal/api/enums';
import {colors} from '@trackingPortal/themes/colors';

const LOAN_TYPE_OPTIONS = [
  {
    label: 'Given',
    value: LoanType.GIVEN,
    description: 'Money you lent to someone',
  },
  {
    label: 'Taken',
    value: LoanType.TAKEN,
    description: 'Money you borrowed',
  },
] as const;

export default function LoanForm() {
  const {values, setFieldValue} = useFormikContext<any>();
  const [pickerVisible, setPickerVisible] = useState(false);
  const deadlineValue = values[EAddLoanFields.DEADLINE];
  const currentDeadline = useMemo(() => {
    if (deadlineValue instanceof Date && !isNaN(deadlineValue.getTime())) {
      return deadlineValue;
    }
    const parsed = new Date(deadlineValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [deadlineValue]);

  const openDeadlinePicker = useCallback(() => {
    InteractionManager.runAfterInteractions(() => setPickerVisible(true));
  }, []);

  return (
    <View style={styles.formRoot}>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Type</Text>
        <View style={styles.toggleGroup}>
          {LOAN_TYPE_OPTIONS.map(option => {
            const isSelected = values[EAddLoanFields.LOAN_TYPE] === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.toggleOption,
                  isSelected && styles.toggleOptionSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setFieldValue(EAddLoanFields.LOAN_TYPE, option.value)}>
                <Text
                  style={[
                    styles.toggleTitle,
                    isSelected && styles.toggleTitleSelected,
                    option.value === LoanType.GIVEN && !isSelected && styles.givenTitle,
                    option.value === LoanType.TAKEN && !isSelected && styles.takenTitle,
                  ]}>
                  {option.label.toUpperCase()}
                </Text>
                <Text style={styles.toggleDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>COUNTERPARTY NAME</Text>
        <FormikTextInput 
          name={EAddLoanFields.NAME} 
          placeholder="Who is this loan with?" 
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>PRINCIPAL AMOUNT</Text>
        <FormikTextInput
          name={EAddLoanFields.AMOUNT}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>DEADLINE</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            mode="flat"
            value={dayjs(currentDeadline).format('MM/DD/YYYY')}
            editable={false}
            pointerEvents="none"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={openDeadlinePicker}
        />
        </View>
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>LOAN PURPOSE / NOTE</Text>
        <FormikTextInput 
          name={EAddLoanFields.NOTE} 
          placeholder="Add details about the agreement..." 
          multiline
          numberOfLines={4}
        />
      </View>
      <DatePicker
        modal
        mode="date"
        open={pickerVisible}
        date={currentDeadline}
        theme="dark"
        onConfirm={selectedDate => {
          setFieldValue(EAddLoanFields.DEADLINE, selectedDate);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formRoot: {
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  toggleContainer: {
    gap: 12,
    marginBottom: 8,
  },
  toggleLabel: {
    display: 'none',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#1b2026',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionSelected: {
    backgroundColor: '#8cafff',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  toggleTitleSelected: {
    color: '#000',
  },
  givenTitle: {
    color: colors.primary,
  },
  takenTitle: {
    color: colors.text,
  },
  toggleDescription: {
    display: 'none',
  },
  fieldSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#8a929a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
