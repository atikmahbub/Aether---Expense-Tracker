import {View, Pressable, StyleSheet, Text, InteractionManager} from 'react-native';
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {useFormikContext} from 'formik';
import {EAddExpenseFields} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';
import {TextInput} from 'react-native-paper';
import {FormikTextInput} from '@trackingPortal/components';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';
import {ExpenseCategoryModel} from '@trackingPortal/api/models';
import CategorySelector from '@trackingPortal/screens/ExpenseScreen/components/CategorySelector';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';

interface ExpenseFormProps {
  categories: ExpenseCategoryModel[];
  categoriesLoading?: boolean;
  categoryError?: string | null;
  refreshCategories?: () => Promise<void> | void;
  recentCategoryIds?: string[];
  defaultCategoryId?: string;
}

export default function ExpenseForm({
  categories,
  categoriesLoading,
  categoryError,
  refreshCategories,
  recentCategoryIds,
  defaultCategoryId,
}: ExpenseFormProps) {
  const {values, setFieldValue} = useFormikContext<any>();
  const [pickerVisible, setPickerVisible] = useState(false);
  const amountInputRef = useRef<TextInput | null>(null);
  const {currency} = useStoreContext();
  const dateValue = values[EAddExpenseFields.DATE];
  const categoryValue = values[EAddExpenseFields.CATEGORY_ID];
  const currencyLabel = `${currency.code} - ${currency.name}`;

  const currentDate = useMemo(() => {
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateValue]);

  useEffect(() => {
    if (!categories.length) {
      return;
    }
    const fallbackId =
      defaultCategoryId &&
      categories.some(category => category.id === defaultCategoryId)
        ? defaultCategoryId
        : categories[0].id;
    const categoryExists = categories.some(
      category => category.id === categoryValue,
    );
    if (!categoryValue || !categoryExists) {
      setFieldValue(EAddExpenseFields.CATEGORY_ID, fallbackId);
    }
  }, [categoryValue, categories, defaultCategoryId, setFieldValue]);

  const openDatePicker = useCallback(() => {
    InteractionManager.runAfterInteractions(() => setPickerVisible(true));
  }, []);

  return (
    <View style={{gap: 24}}>
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>TRANSACTION AMOUNT</Text>
        <TextInput
          mode="flat"
          value={values[EAddExpenseFields.AMOUNT] || ''}
          onChangeText={text => setFieldValue(EAddExpenseFields.AMOUNT, text)}
          keyboardType="numeric"
          ref={amountInputRef}
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#666"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          left={
            <TextInput.Affix
              text={`${currency.symbol} `}
              textStyle={styles.amountCurrency}
            />
          }
        />
        <View style={styles.currencyPill}>
          <Text style={styles.currencyPillText}>{currencyLabel}</Text>
        </View>
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>PURPOSE</Text>
        <FormikTextInput 
          name={EAddExpenseFields.DESCRIPTION} 
          placeholder="What is this for?" 
        />
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <CategorySelector
          categories={categories}
          selectedCategoryId={categoryValue}
          onSelect={id => setFieldValue(EAddExpenseFields.CATEGORY_ID, id)}
          loading={categoriesLoading}
          error={categoryError || undefined}
          onRetry={refreshCategories}
          recentCategoryIds={recentCategoryIds}
        />
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.sectionLabel}>SELECT DATE</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            mode="flat"
            value={dayjs(currentDate).format('MMMM D, YYYY')}
            editable={false}
            pointerEvents="none"
            style={styles.dateInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={openDatePicker}
          />
        </View>
      </View>

      <DatePicker
        modal
        mode="date"
        open={pickerVisible}
        date={currentDate}
        theme="dark"
        onConfirm={selectedDate => {
          setFieldValue(EAddExpenseFields.DATE, selectedDate);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  amountContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    color: '#8A929A',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 56,
    fontFamily: 'Manrope',
    fontWeight: '800',
    textAlign: 'center',
    height: 80,
    width: '100%',
  },
  amountCurrency: {
    color: '#a1faff',
    fontSize: 32,
    fontWeight: '400',
  },
  currencyPill: {
    backgroundColor: '#1b2026',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  currencyPillText: {
    color: '#8A929A',
    fontSize: 12,
  },
  fieldSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#8A929A',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: '#0f1418',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateInput: {
    backgroundColor: 'transparent',
  },
});
