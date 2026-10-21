import {View, Pressable, StyleSheet, Text, TouchableOpacity, Keyboard} from 'react-native';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import React, {Fragment, useCallback, useMemo, useState} from 'react';
import {useFormikContext} from 'formik';
import {EAddInvestFormFields} from '@trackingPortal/screens/InvestScreen';
import {TextInput} from 'react-native-paper';
import {FormikCheckboxField, FormikTextInput, LoadingButton} from '@trackingPortal/components';
import ScalarCalendar from '@trackingPortal/components/ScalarCalendar';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

interface IInvestForm {
  update?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  /**
   * Detail-sheet mode: rendered below a full-width Cancel / Save changes
   * footer (used for the sheet's delete link).
   */
  belowFooter?: React.ReactNode;
}

const InvestForm: React.FC<IInvestForm> = ({update, onSubmit, onCancel, loading, belowFooter}) => {
  const sheetMode = belowFooter !== undefined;
  const { colors, isDark } = useAppTheme();
  const { t, formatDate } = useTranslation();
  // Cancel uses the loan sheet's soft pill (solid in light mode).
  const sheetCancelTone = useMemo(
    () => ({
      button: { backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg },
      text: { color: colors.sheetText },
    }),
    [colors, isDark],
  );
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  const openStartPicker = useCallback(() => {
    setStartPickerVisible(true);
  }, []);

  const openEndPicker = useCallback(() => {
    setEndPickerVisible(true);
  }, []);

  return (
    <View style={styles.formRoot}>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('invest.nameCaps')}</Text>
        <FormikTextInput
          name={EAddInvestFormFields.NAME}
          placeholder={t('invest.namePlaceholder')}
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('invest.amountCaps')}</Text>
        <FormikTextInput
          name={EAddInvestFormFields.AMOUNT}
          placeholder="$ 0.00"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('invest.startDateCaps')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            mode="flat"
            value={formatDate(startDate, 'DD MMM YYYY')}
            editable={false}
            pointerEvents="none"
            right={<TextInput.Icon icon="calendar-month-outline" color="#5a6069" />}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={openStartPicker}
          />
        </View>
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>{t('invest.noteCaps')}</Text>
        <FormikTextInput
          name={EAddInvestFormFields.NOTE}
          placeholder={t('invest.notePlaceholder')}
          multiline
          numberOfLines={4}
        />
      </View>

      <ScalarCalendar
        visible={startPickerVisible}
        date={startDate}
        title={t('invest.startDateTitle')}
        onConfirm={selectedDate => {
          setFieldValue(EAddInvestFormFields.START_DATE, selectedDate);
          setStartPickerVisible(false);
        }}
        onCancel={() => setStartPickerVisible(false)}
      />

      {update && (
        <Fragment>
          <View style={styles.fieldSection}>
            <Text style={styles.sectionLabel}>{t('invest.endDateCaps')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                mode="flat"
                value={formatDate(endDate, 'DD MMM YYYY')}
                editable={false}
                pointerEvents="none"
                right={<TextInput.Icon icon="calendar-month-outline" color="#5a6069" />}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={openEndPicker}
              />
            </View>
          </View>
          <ScalarCalendar
            visible={endPickerVisible}
            date={endDate}
            title={t('invest.endDateTitle')}
            onConfirm={selectedDate => {
              setFieldValue(EAddInvestFormFields.END_DATE, selectedDate);
              setEndPickerVisible(false);
            }}
            onCancel={() => setEndPickerVisible(false)}
          />
          <View style={styles.fieldSection}>
            <Text style={styles.sectionLabel}>{t('invest.returnCaps')}</Text>
            <FormikTextInput
              name={EAddInvestFormFields.EARNED}
              placeholder="$ 0.00"
              keyboardType="numeric"
            />
          </View>
          <FormikCheckboxField
            label={t('invest.markCompleted')}
            name={EAddInvestFormFields.STATUS}
          />
        </Fragment>
      )}

      <View style={[styles.footer, styles.sheetFooter]}>
        <TouchableOpacity
          style={[styles.cancelButton, styles.sheetCancel, sheetCancelTone.button]}
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, sheetCancelTone.text]}>{t('common.cancel')}</Text>
        </TouchableOpacity>

        <View style={[styles.saveButtonWrapper, styles.sheetSave]}>
          <LoadingButton
            style={styles.sheetSaveButton}
            label={t(sheetMode || update ? "common.saveChanges" : "invest.add")}
            loading={loading}
            onPress={() => {
              Keyboard.dismiss();
              onSubmit();
            }}
          />
        </View>
      </View>
      {belowFooter}
    </View>
  );
};

export default InvestForm;

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    formRoot: {
      gap: 16,
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
    inputWrapper: {
      position: 'relative',
      borderRadius: 18,
      overflow: 'hidden',
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
    // Two full-width pills, matching the detail sheets.
    sheetFooter: { marginTop: 8, marginBottom: 0, gap: 10, justifyContent: 'flex-start' },
    sheetCancel: { flex: 1, height: 54 },
    sheetSave: { flex: 1.4, minWidth: 0 },
    sheetSaveButton: { height: 54, paddingVertical: 0, justifyContent: 'center' },
  });
}
