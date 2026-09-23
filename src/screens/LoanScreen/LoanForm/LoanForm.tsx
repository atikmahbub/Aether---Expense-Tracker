import {View, Pressable, StyleSheet, Text, TouchableOpacity, Keyboard} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useFormikContext} from 'formik';
import {EAddLoanFields} from '@trackingPortal/screens/LoanScreen';
import {TextInput} from 'react-native-paper';
import {FormikTextInput, LoadingButton} from '@trackingPortal/components';
import ScalarCalendar from '@trackingPortal/components/ScalarCalendar';
import dayjs from 'dayjs';
import {LoanType} from '@trackingPortal/api/enums';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';
import PillChip from '@trackingPortal/components/scalar/PillChip';

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

interface LoanFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function LoanForm({onSubmit, onCancel, loading}: LoanFormProps) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
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
    setPickerVisible(true);
  }, []);

  return (
    <View style={styles.formRoot}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleGroup}>
          {LOAN_TYPE_OPTIONS.map(option => (
            <PillChip
              key={option.value}
              variant="sheet"
              label={option.label}
              active={values[EAddLoanFields.LOAN_TYPE] === option.value}
              onPress={() => setFieldValue(EAddLoanFields.LOAN_TYPE, option.value)}
            />
          ))}
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
      <ScalarCalendar
        visible={pickerVisible}
        date={currentDeadline}
        title="Loan deadline"
        onConfirm={selectedDate => {
          setFieldValue(EAddLoanFields.DEADLINE, selectedDate);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.saveButtonWrapper}>
          <LoadingButton
            label="Save Loan Entry"
            loading={loading}
            onPress={() => {
              Keyboard.dismiss();
              onSubmit();
            }}
          />
        </View>
      </View>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  isDark: boolean,
) {
  return StyleSheet.create({
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
      gap: 6,
    },
    toggleOption: {
      flex: 1,
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: colors.softChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleOptionSelected: {
      backgroundColor: colors.chipActiveBg,
    },
    toggleTitle: {
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
      letterSpacing: 0.5,
    },
    toggleTitleSelected: {
      color: colors.chipActiveInk,
    },
    givenTitle: {
      color: colors.softChipInk,
    },
    takenTitle: {
      color: colors.softChipInk,
    },
    toggleDescription: {
      display: 'none',
    },
    fieldSection: {
      gap: 8,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
      textTransform: 'uppercase',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      paddingHorizontal: 20,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 999,
      backgroundColor: colors.softChipBg,
    },
    cancelButtonText: {
      color: colors.softChipInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    saveButtonWrapper: {
      minWidth: 140,
    },
  });
}
