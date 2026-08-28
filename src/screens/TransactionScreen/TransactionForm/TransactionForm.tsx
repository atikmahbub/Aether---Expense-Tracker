import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ExpenseCategoryModel } from "@trackingPortal/api/models";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import {
  EAddTransactionFields,
  resolveTransactionAmount,
} from "@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import ScalarCalendar from "@trackingPortal/components/ScalarCalendar";
import { withHaptic } from "@trackingPortal/utils/haptic";
import { ImpactFeedbackStyle } from "expo-haptics";

const AMOUNT_MAX_LENGTH = 18;

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
  const amountValue = String(values[EAddTransactionFields.AMOUNT] || "");

  // Every keypad tap gives the amount a short scale pulse so the digit that
  // just landed is visible without looking away from the thumb.
  const amountScale = useSharedValue(1);
  const pulseAmount = useCallback(
    (peak: number) => {
      amountScale.value = withSequence(
        withTiming(peak, { duration: 70 }),
        withSpring(1, { damping: 12, stiffness: 320, mass: 0.5 }),
      );
    },
    [amountScale],
  );
  const amountAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const currentDate = useMemo(() => {
    if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
      return dateValue;
    }
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateValue]);

  // A long calculator expression is shrunk to fit instead of scrolling out of
  // view: the field is centred, so overflow would hide the digits just typed.
  const amountTextStyle = useMemo(() => {
    const length = amountValue.length;
    const fontSize =
      length <= 8 ? 48 : length <= 11 ? 38 : length <= 14 ? 30 : 25;
    return {
      fontSize,
      lineHeight: Math.round(fontSize * 1.3),
      letterSpacing: fontSize >= 48 ? -1.44 : -0.5,
    };
  }, [amountValue]);

  const isToday = dayjs(currentDate).isSame(dayjs(), "day");
  const canSave =
    (resolveTransactionAmount(amountValue) ?? 0) > 0 &&
    Boolean(categoryValue) &&
    !loading;

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
      if (key === "clear") {
        setFieldValue(EAddTransactionFields.AMOUNT, "");
        return;
      }
      if (key === "backspace") {
        setFieldValue(EAddTransactionFields.AMOUNT, current.slice(0, -1));
        return;
      }
      if (key === "=") {
        // Only the keypad's two supported operations are accepted here. This
        // keeps evaluation predictable without executing arbitrary input.
        const parts = current.split(/([+-])/);
        if (
          parts.length < 3 ||
          parts.some((part, index) =>
            index % 2 === 0
              ? !/^\d+(?:\.\d+)?$/.test(part)
              : part !== "+" && part !== "-",
          )
        ) {
          return;
        }

        let total = Number(parts[0]);
        for (let index = 1; index < parts.length; index += 2) {
          const operand = Number(parts[index + 1]);
          total = parts[index] === "+" ? total + operand : total - operand;
        }
        if (Number.isFinite(total)) {
          setFieldValue(EAddTransactionFields.AMOUNT, String(total));
        }
        return;
      }
      // The keypad writes straight to the field, so it has to honour the same
      // cap the text input enforces on typed input.
      if (current.length >= AMOUNT_MAX_LENGTH && !/[+-]$/.test(current)) return;

      if (key === "+" || key === "-") {
        if (!current || current.endsWith(".")) return;
        if (/[+-]$/.test(current)) {
          setFieldValue(
            EAddTransactionFields.AMOUNT,
            `${current.slice(0, -1)}${key}`,
          );
          return;
        }
        setFieldValue(EAddTransactionFields.AMOUNT, `${current}${key}`);
        return;
      }
      const activeNumber = current.split(/[+-]/).pop() || "";
      const prefix = current.slice(0, current.length - activeNumber.length);
      if (key === "." && activeNumber.includes(".")) return;
      if (key === "." && !activeNumber) {
        setFieldValue(EAddTransactionFields.AMOUNT, `${current}0.`);
        return;
      }
      if (activeNumber === "0" && key !== ".") {
        setFieldValue(EAddTransactionFields.AMOUNT, `${prefix}${key}`);
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
        <Animated.View style={[styles.amountRow, amountAnimatedStyle]}>
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
          <TextInput
            ref={amountInputRef}
            accessibilityLabel="Amount"
            value={amountValue}
            onChangeText={(text) =>
              setFieldValue(
                EAddTransactionFields.AMOUNT,
                text.replace(/[^0-9.+-]/g, ""),
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
            style={[styles.amountInput, amountTextStyle]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.brand}
            caretHidden={false}
            maxLength={AMOUNT_MAX_LENGTH}
          />
        </Animated.View>
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
          <View style={styles.keypadNumbers}>
            {[
              ["7", "8", "9"],
              ["4", "5", "6"],
              ["1", "2", "3"],
              [".", "0", "backspace"],
            ].map((row) => (
              <View key={row.join("-")} style={styles.keypadRow}>
                {row.map((key) => (
                  <Pressable
                    accessibilityLabel={
                      key === "backspace" ? "Delete digit" : `Digit ${key}`
                    }
                    key={key}
                    hitSlop={KEY_HIT_SLOP}
                    onPress={() =>
                      withHaptic(() => {
                        handleKeyPress(key);
                        pulseAmount(key === "backspace" ? 0.96 : 1.05);
                      }, ImpactFeedbackStyle.Light)
                    }
                    style={({ pressed }) => [
                      styles.key,
                      styles.numberKey,
                      pressed && styles.keyPressed,
                    ]}
                  >
                    {key === "backspace" ? (
                      <MaterialCommunityIcons
                        name="backspace"
                        size={24}
                        color={colors.textPrimary}
                      />
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.keypadActions}>
            {["clear", "-", "+", "="].map((key) => (
                <Pressable
                  accessibilityLabel={
                    key === "clear"
                      ? "Clear amount"
                      : key === "="
                      ? "Calculate amount"
                      : `${key === "+" ? "Add" : "Subtract"} operator`
                  }
                  key={key}
                  hitSlop={KEY_HIT_SLOP}
                  onPress={() =>
                    withHaptic(
                      () => {
                        handleKeyPress(key);
                        pulseAmount(
                          key === "clear" ? 0.94 : key === "=" ? 1.12 : 1.06,
                        );
                      },
                      // Operators and clear get a firmer tap than the digits so
                      // the two halves of the keypad feel distinct.
                      key === "="
                        ? ImpactFeedbackStyle.Heavy
                        : ImpactFeedbackStyle.Medium,
                    )
                  }
                  style={({ pressed }) => [
                    styles.key,
                    styles.actionKey,
                    key === "clear" ? styles.clearKey : styles.operatorKey,
                    pressed &&
                      (key === "clear"
                        ? styles.keyPressed
                        : styles.operatorKeyPressed),
                  ]}
                >
                  <Text
                    style={[
                      styles.keyText,
                      key !== "clear" && styles.operatorKeyText,
                    ]}
                  >
                    {OPERATOR_GLYPHS[key] ?? key}
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Keys are sized for a comfortable thumb target (Apple/Material both ask for
// ~44dp); the hit slop reclaims the gutters so there is no dead space between
// neighbouring keys.
const KEY_HEIGHT = 54;
// The keypad mirrors the iOS calculator: a neutral clear key above filled
// operator keys, with the typographic minus/multiplication glyphs.
const OPERATOR_GLYPHS: Record<string, string> = {
  clear: "C",
  "-": "\u2212",
  "+": "+",
  "=": "=",
};
const KEY_GAP = 8;
const KEY_HIT_SLOP = {
  top: KEY_GAP / 2,
  bottom: KEY_GAP / 2,
  left: KEY_GAP / 2,
  right: KEY_GAP / 2,
};

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
      width: 300,
      maxWidth: "88%",
      padding: 0,
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
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
      gap: KEY_GAP,
      marginTop: 4,
    },
    keypadNumbers: { flex: 3, gap: KEY_GAP },
    keypadRow: { flexDirection: "row", gap: KEY_GAP },
    keypadActions: { flex: 1, gap: KEY_GAP },
    key: {
      height: KEY_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    numberKey: { flex: 1 },
    actionKey: { width: "100%", flex: 1 },
    clearKey: {
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
    },
    operatorKey: {
      borderColor: colors.brand,
      backgroundColor: colors.brand,
    },
    operatorKeyPressed: {
      backgroundColor: colors.brandText,
      borderColor: colors.brandText,
    },
    operatorKeyText: { color: colors.onBrand },
    keyPressed: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderStrong,
    },
    keyText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 22,
      lineHeight: 28,
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
