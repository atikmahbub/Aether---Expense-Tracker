import {View, Pressable, StyleSheet, Text, TouchableOpacity, Keyboard} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useFormikContext} from 'formik';
import {EAddLoanFields} from '@trackingPortal/screens/LoanScreen';
import {TextInput} from 'react-native-paper';
import {FormikTextInput, LoadingButton} from '@trackingPortal/components';
import ScalarCalendar from '@trackingPortal/components/ScalarCalendar';
import {LoanType} from '@trackingPortal/api/enums';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';
import PillChip from '@trackingPortal/components/scalar/PillChip';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';

const LOAN_TYPE_OPTIONS = [
  {
    label: 'loan.given',
    value: LoanType.GIVEN,
    description: 'Money you lent to someone',
  },
  {
    label: 'loan.taken',
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
  const {t, formatDate} = useTranslation();
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
              label={t(option.label)}
              active={values[EAddLoanFields.LOAN_TYPE] === option.value}
              onPress={() => setFieldValue(EAddLoanFields.LOAN_TYPE, option.value)}
            />
          ))}
        </View>
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('loan.counterparty')}</Text>
        <FormikTextInput
          name={EAddLoanFields.NAME}
          placeholder={t('loan.namePlaceholder')}
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('loan.principalCaps')}</Text>
        <FormikTextInput
          name={EAddLoanFields.AMOUNT}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('loan.deadlineCaps')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            mode="flat"
            value={formatDate(currentDeadline, 'MM/DD/YYYY')}
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
        <Text style={styles.sectionLabel}>{t('loan.noteCaps')}</Text>
        <FormikTextInput
          name={EAddLoanFields.NOTE}
          placeholder={t('loan.notePlaceholder')}
          multiline
          numberOfLines={4}
        />
      </View>
      <ScalarCalendar
        visible={pickerVisible}
        date={currentDeadline}
        title={t('loan.deadline')}
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
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>

        <View style={styles.saveButtonWrapper}>
          <LoadingButton
            style={styles.saveButton}
            label={t('loan.add')}
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
    // Two full-width pills (1 : 1.4), matching the detail sheets.
    footer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
      marginBottom: 16,
      alignItems: 'center',
    },
    cancelButton: {
      flex: 1,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 999,
      backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg,
    },
    cancelButtonText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    saveButtonWrapper: {
      flex: 1.4,
    },
    saveButton: { height: 54, paddingVertical: 0, justifyContent: 'center' },
  });
}
