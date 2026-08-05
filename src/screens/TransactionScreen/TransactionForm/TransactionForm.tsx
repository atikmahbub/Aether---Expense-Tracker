import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ExpenseCategoryModel } from "@trackingPortal/api/models";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { EAddTransactionFields } from "@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants";
import CategorySelector from "@trackingPortal/screens/TransactionScreen/components/CategorySelector";
import { designTokens } from "@trackingPortal/themes/designTokens";
import dayjs from "dayjs";
import { useFormikContext } from "formik";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ScalarCalendar from "@trackingPortal/components/ScalarCalendar";

interface TransactionFormProps {
  categories: ExpenseCategoryModel[];
  categoriesLoading?: boolean;
  categoryError?: string | null;
  refreshCategories?: () => Promise<void> | void;
  recentCategoryIds?: string[];
  defaultCategoryId?: string;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  showShortcutKeypad?: boolean;
}

export default function TransactionForm({
  categories,
  categoriesLoading,
  categoryError,
  refreshCategories,
  recentCategoryIds,
  defaultCategoryId,
  onSubmit,
  onCancel,
  loading,
  showShortcutKeypad = false,
}: TransactionFormProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    values,
    errors,
    touched,
    setFieldTouched,
    setFieldValue,
  } = useFormikContext<any>();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [purposeFocused, setPurposeFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const { currency } = useStoreContext();
  const dateValue = values[EAddTransactionFields.DATE];
  const categoryValue = values[EAddTransactionFields.CATEGORY_ID];
  const amountValue = values[EAddTransactionFields.AMOUNT] || "";

  const currentDate = useMemo(() => {
    if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
      return dateValue;
    }
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateValue]);

  const isToday = dayjs(currentDate).isSame(dayjs(), "day");
  const canSave =
    Number(amountValue) > 0 && Boolean(categoryValue) && !loading;

  useEffect(() => {
    if (!categories.length) return;
    const fallbackId =
      defaultCategoryId &&
      categories.some((category) => category.id === defaultCategoryId)
        ? defaultCategoryId
        : categories[0].id;
    const categoryExists = categories.some(
      (category) => category.id === categoryValue,
    );
    if (!categoryValue || !categoryExists) {
      setFieldValue(EAddTransactionFields.CATEGORY_ID, fallbackId);
    }
  }, [categoryValue, categories, defaultCategoryId, setFieldValue]);

  const openDatePicker = useCallback(() => setPickerVisible(true), []);
  const handleKeyPress = useCallback(
    (key: string) => {
      const current = String(amountValue);
      if (key === "backspace") {
        setFieldValue(EAddTransactionFields.AMOUNT, current.slice(0, -1));
        return;
      }
      if (key === "." && current.includes(".")) return;
      if (key === "." && !current) {
        setFieldValue(EAddTransactionFields.AMOUNT, "0.");
        return;
      }
      if (current === "0" && key !== ".") {
        setFieldValue(EAddTransactionFields.AMOUNT, key);
        return;
      }
      setFieldValue(EAddTransactionFields.AMOUNT, `${current}${key}`);
    },
    [amountValue, setFieldValue],
  );

  return (
    <View style={styles.form}>
      <Pressable
        onPress={() => amountInputRef.current?.focus()}
        style={styles.amountContainer}
      >
        <Text style={styles.capsLabel}>AMOUNT · {currency.code}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
          <TextInput
            ref={amountInputRef}
            accessibilityLabel="Amount"
            value={amountValue}
            onChangeText={(text) =>
              setFieldValue(
                EAddTransactionFields.AMOUNT,
                text.replace(/[^0-9.]/g, ""),
              )
            }
            onBlur={() => {
              setAmountFocused(false);
              setFieldTouched(EAddTransactionFields.AMOUNT, true);
            }}
            keyboardType="decimal-pad"
            showSoftInputOnFocus={!showShortcutKeypad}
            onFocus={() => {
              setAmountFocused(true);
              setPurposeFocused(false);
            }}
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.brand}
            caretHidden={false}
            maxLength={12}
          />
        </View>
        {!amountFocused &&
          touched[EAddTransactionFields.AMOUNT] &&
          errors[EAddTransactionFields.AMOUNT] && (
            <Text style={styles.errorText}>
              {String(errors[EAddTransactionFields.AMOUNT])}
            </Text>
          )}
      </Pressable>

      <View style={styles.fieldSection}>
        <Text style={styles.capsLabel}>PURPOSE</Text>
        <TextInput
          accessibilityLabel="Purpose"
          allowFontScaling={false}
          value={values[EAddTransactionFields.DESCRIPTION] || ""}
          onChangeText={(text) =>
            setFieldValue(EAddTransactionFields.DESCRIPTION, text)
          }
          onBlur={() =>
            {
              setFieldTouched(EAddTransactionFields.DESCRIPTION, true);
              setPurposeFocused(false);
            }
          }
          onFocus={() => setPurposeFocused(true)}
          placeholder="What is this for?"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.brand}
          style={styles.purposeInput}
          multiline={false}
          maxLength={120}
        />
        {touched[EAddTransactionFields.DESCRIPTION] &&
          errors[EAddTransactionFields.DESCRIPTION] && (
            <Text style={styles.errorText}>
              {String(errors[EAddTransactionFields.DESCRIPTION])}
            </Text>
          )}
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.capsLabel}>CATEGORY</Text>
        <CategorySelector
          categories={categories}
          selectedCategoryId={categoryValue}
          onSelect={(id) =>
            setFieldValue(EAddTransactionFields.CATEGORY_ID, id)
          }
          loading={categoriesLoading}
          error={categoryError || undefined}
          onRetry={refreshCategories}
          recentCategoryIds={recentCategoryIds}
        />
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.capsLabel}>DATE</Text>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() =>
              setFieldValue(EAddTransactionFields.DATE, new Date())
            }
            style={({ pressed }) => [
              styles.dateButton,
              isToday && styles.dateButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={17}
              color={isToday ? colors.brandText : colors.textSecondary}
            />
            <Text
              style={[
                styles.dateButtonText,
                isToday && styles.dateButtonTextActive,
              ]}
            >
              Today · {dayjs().format("D MMM")}
            </Text>
          </Pressable>
          <Pressable
            onPress={openDatePicker}
            style={({ pressed }) => [
              styles.dateButton,
              !isToday && styles.dateButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-month"
              size={17}
              color={!isToday ? colors.brandText : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.dateButtonText,
                !isToday && styles.dateButtonTextActive,
              ]}
            >
              {isToday ? "Pick a date" : dayjs(currentDate).format("D MMM")}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScalarCalendar
        visible={pickerVisible}
        date={currentDate}
        title="Transaction date"
        onConfirm={(selectedDate) => {
          setFieldValue(EAddTransactionFields.DATE, selectedDate);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            onSubmit();
          }}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving…" : "Save Entry"}
          </Text>
        </Pressable>
      </View>

      {showShortcutKeypad && !purposeFocused && (
        <View style={styles.keypad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map(
            (key) => (
              <Pressable
                accessibilityLabel={
                  key === "backspace" ? "Delete digit" : `Digit ${key}`
                }
                key={key}
                onPress={() => handleKeyPress(key)}
                style={({ pressed }) => [
                  styles.key,
                  pressed && styles.keyPressed,
                ]}
              >
                {key === "backspace" ? (
                  <MaterialCommunityIcons
                    name="backspace"
                    size={22}
                    color={colors.textPrimary}
                  />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </Pressable>
            ),
          )}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    form: { gap: 14 },
    amountContainer: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 2,
    },
    capsLabel: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caps,
    },
    amountRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    currencySymbol: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.bengali,
      fontSize: 30,
      lineHeight: 44,
      fontWeight: "700",
    },
    amountInput: {
      width: 220,
      maxWidth: "75%",
      padding: 0,
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 48,
      lineHeight: 62,
      fontWeight: "700",
      letterSpacing: -1.44,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
      paddingTop: 4,
    },
    fieldSection: { gap: 8 },
    purposeInput: {
      width: "100%",
      flexShrink: 0,
      height: 52,
      paddingHorizontal: 16,
      paddingVertical: 0,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      fontFamily: designTokens.font.medium,
      fontSize: 16,
      lineHeight: 20,
      textAlignVertical: "center",
      includeFontPadding: false,
    },
    dateRow: { flexDirection: "row", gap: 10 },
    dateButton: {
      flex: 1,
      height: 48,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.surface,
    },
    dateButtonActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brandWash,
    },
    dateButtonText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    dateButtonTextActive: {
      color: colors.brandText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    cancelButton: {
      height: 54,
      paddingHorizontal: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      borderRadius: designTokens.radius.full,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
      fontWeight: "600",
    },
    saveButton: {
      flex: 1,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.brand,
    },
    saveButtonDisabled: { opacity: 0.4 },
    saveButtonPressed: { backgroundColor: colors.brandText },
    saveButtonText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontWeight: "700",
    },
    keypad: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    key: {
      width: "31.7%",
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    keyPressed: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderStrong,
    },
    keyText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    pressed: { backgroundColor: colors.surfaceSunken },
    errorText: {
      color: colors.negative,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
  });
}
