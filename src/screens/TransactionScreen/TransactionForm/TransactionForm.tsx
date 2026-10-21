import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ExpenseCategoryModel } from "@trackingPortal/api/models";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { useFrequencyText } from "@trackingPortal/i18n/frequency";
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
import RepeatPicker, {
  RepeatChoice,
} from "@trackingPortal/screens/TransactionScreen/components/RepeatPicker";
import type { RecurringFrequency } from "@trackingPortal/api/models/RecurringRuleModel";
import { withHaptic } from "@trackingPortal/utils/haptic";
import { ImpactFeedbackStyle } from "expo-haptics";

// Effectively no limit on how long a chained expression can get — high enough
// that a keypad user never reaches it, low enough to stop pathological input.
const AMOUNT_MAX_LENGTH = 120;
// Past this many characters the expression stops shrinking and starts
// scrolling horizontally instead, so digits stay readable however long it runs.
const AMOUNT_SCROLL_THRESHOLD = 16;

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
  /**
   * Detail-sheet mode: rendered below a full-width Cancel / Save changes
   * footer (used for the sheet's delete link).
   */
  belowFooter?: React.ReactNode;
  /** Shows the Repeat row (new entries only). */
  allowRepeat?: boolean;
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
  belowFooter,
  allowRepeat = false,
}: TransactionFormProps) {
  const sheetMode = belowFooter !== undefined;
  const { colors, isDark } = useAppTheme();
  // Cancel uses the loan sheet's soft pill (solid in light mode).
  const sheetCancelTone = useMemo(
    () => ({
      button: { backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg },
      text: { color: colors.sheetText },
    }),
    [colors, isDark],
  );
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, formatDate, translateText } = useTranslation();
  const { frequencyLabel, describeFrequency } = useFrequencyText();
  const {
    values,
    errors,
    touched,
    setFieldTouched,
    setFieldValue,
  } = useFormikContext<any>();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [repeatVisible, setRepeatVisible] = useState(false);
  const [purposeFocused, setPurposeFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  // The caret is controlled so it can be pushed back to the end after every
  // keypad tap. Left to itself the input stops following the caret once the
  // expression overflows, which hides the digits just entered.
  const [amountSelection, setAmountSelection] = useState({ start: 0, end: 0 });
  const { currency } = useStoreContext();
  const dateValue = values[EAddTransactionFields.DATE];
  const categoryValue = values[EAddTransactionFields.CATEGORY_ID];
  const amountValue = String(values[EAddTransactionFields.AMOUNT] || "");
  const repeatValue: RepeatChoice =
    (allowRepeat && values[EAddTransactionFields.REPEAT]) || "never";
  const repeatEnd: Date | null = values[EAddTransactionFields.REPEAT_END] ?? null;
  const repeating = repeatValue !== "never";

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

  // A long calculator expression shrinks down to a readable floor; beyond that
  // the field left-aligns and scrolls horizontally, keeping the caret — and so
  // the digit just typed — at the visible end.
  const isAmountScrolling = amountValue.length > AMOUNT_SCROLL_THRESHOLD;

  // Every value change lands at the end, so put the caret there and let the
  // input scroll to it. Tapping elsewhere in the field still moves the caret
  // freely — that goes through onSelectionChange without touching the value.
  useEffect(() => {
    setAmountSelection({ start: amountValue.length, end: amountValue.length });
  }, [amountValue]);
  const amountTextStyle = useMemo(() => {
    const length = amountValue.length;
    const fontSize =
      // Unbounded runs ~25% wider than the old face; sizes scaled to match.
      length <= 6 ? 42 : length <= 9 ? 34 : length <= 12 ? 27 : 22;
    return {
      fontSize,
      lineHeight: Math.round(fontSize * 1.3),
      letterSpacing: -fontSize * 0.02,
      textAlign: (length > AMOUNT_SCROLL_THRESHOLD ? "left" : "center") as
        | "left"
        | "center",
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
        <Text style={styles.capsLabel}>{t("form.amount", { code: currency.code })}</Text>
        <Animated.View
          style={[
            styles.amountRow,
            isAmountScrolling && styles.amountRowScrolling,
            amountAnimatedStyle,
          ]}
        >
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
          <TextInput
            ref={amountInputRef}
            accessibilityLabel={t("form.amountA11y")}
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
            selection={amountSelection}
            onSelectionChange={(event) =>
              setAmountSelection(event.nativeEvent.selection)
            }
            scrollEnabled
            maxLength={AMOUNT_MAX_LENGTH}
          />
        </Animated.View>
        {!amountFocused &&
          touched[EAddTransactionFields.AMOUNT] &&
          errors[EAddTransactionFields.AMOUNT] && (
            <Text style={styles.errorText}>
              {translateText(String(errors[EAddTransactionFields.AMOUNT]))}
            </Text>
          )}
      </Pressable>

      <View style={styles.fieldSection}>
        <Text style={styles.capsLabel}>{t("form.purpose")}</Text>
        <TextInput
          accessibilityLabel={t("form.purposeA11y")}
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
          placeholder={t("form.purposePlaceholder")}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.brand}
          style={styles.purposeInput}
          multiline={false}
          maxLength={120}
        />
        {touched[EAddTransactionFields.DESCRIPTION] &&
          errors[EAddTransactionFields.DESCRIPTION] && (
            <Text style={styles.errorText}>
              {translateText(String(errors[EAddTransactionFields.DESCRIPTION]))}
            </Text>
          )}
      </View>

      <View style={styles.fieldSection}>
        <Text style={styles.capsLabel}>{t("form.category")}</Text>
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
        <Text numberOfLines={1} style={styles.capsLabel}>
          {repeating
            ? `${t("form.starts", {
                when: describeFrequency(repeatValue, currentDate),
              })}${
                repeatEnd
                  ? t("form.until", { date: formatDate(repeatEnd, "D MMM YYYY") })
                  : ""
              }`.toUpperCase()
            : t("form.date")}
        </Text>
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
              color={isToday ? colors.chipActiveInk : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.dateButtonText,
                isToday && styles.dateButtonTextActive,
              ]}
            >
              {t("form.today", { date: formatDate(new Date(), "D MMM") })}
            </Text>
          </Pressable>
          {/* Icon only until a date is picked; then it carries that date. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isToday
                ? t("form.pickDate")
                : t("form.dateA11y", { date: formatDate(currentDate, "D MMMM") })
            }
            onPress={openDatePicker}
            style={({ pressed }) => [
              styles.dateButton,
              styles.compactButton,
              !isToday && styles.dateButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-month"
              size={18}
              color={!isToday ? colors.chipActiveInk : colors.textSecondary}
            />
            {!isToday && (
              <Text numberOfLines={1} style={[styles.dateButtonText, styles.dateButtonTextActive]}>
                {formatDate(currentDate, "D MMM")}
              </Text>
            )}
          </Pressable>
          {allowRepeat && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(repeating ? "form.repeatSettings" : "form.repeat")}
              accessibilityState={{ selected: repeating }}
              onPress={() => {
                Keyboard.dismiss();
                setRepeatVisible(true);
              }}
              style={({ pressed }) => [
                styles.dateButton,
                repeating && styles.dateButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="repeat"
                size={17}
                color={repeating ? colors.chipActiveInk : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[styles.dateButtonText, repeating && styles.dateButtonTextActive]}
              >
                {repeating
                  ? frequencyLabel(repeatValue as RecurringFrequency)
                  : t("form.repeat")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {allowRepeat && (
        <RepeatPicker
          visible={repeatVisible}
          startDate={currentDate}
          frequency={repeatValue}
          endDate={repeatEnd}
          onDone={(frequency, endDate, startDate) => {
            setFieldValue(EAddTransactionFields.DATE, startDate);
            setFieldValue(EAddTransactionFields.REPEAT, frequency);
            setFieldValue(EAddTransactionFields.REPEAT_END, endDate);
            setRepeatVisible(false);
          }}
          onCancel={() => setRepeatVisible(false)}
        />
      )}

      <ScalarCalendar
        visible={pickerVisible}
        date={currentDate}
        title={t("form.transactionDate")}
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
            styles.sheetCancel,
            sheetCancelTone.button,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
        >
          <Text style={[styles.cancelButtonText, sheetCancelTone.text]}>{t("form.cancel")}</Text>
        </Pressable>
        <Pressable
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            styles.sheetSave,
            !canSave && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            onSubmit();
          }}
        >
          <Text style={styles.saveButtonText}>
            {t(loading ? "form.saving" : sheetMode ? "form.saveChanges" : "form.addEntry")}
          </Text>
        </Pressable>
      </View>
      {belowFooter}

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
                      key === "backspace" ? t("form.deleteDigit") : t("form.digit", { key })
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
                      ? t("form.clearAmount")
                      : key === "="
                      ? t("form.calculate")
                      : t(key === "+" ? "form.addOperator" : "form.subtractOperator")
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
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.96,
    },
    amountRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Once the expression overflows, the row hugs the left edge so the input
    // owns the remaining width and can scroll within it.
    amountRowScrolling: {
      justifyContent: "flex-start",
      alignSelf: "stretch",
      paddingHorizontal: 16,
      gap: 8,
    },
    currencySymbol: {
      color: colors.heroInk,
      fontFamily: designTokens.font.bengali,
      fontSize: 30,
      lineHeight: 44,
      fontWeight: "700",
    },
    amountInput: {
      flexShrink: 1,
      width: 300,
      maxWidth: "88%",
      padding: 0,
      color: colors.heroInk,
      fontFamily: designTokens.font.display,
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
      borderWidth: 1,
      borderColor: colors.groupBorder,
      borderRadius: 18,
      backgroundColor: colors.groupBg,
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
      lineHeight: 20,
      textAlignVertical: "center",
      includeFontPadding: false,
    },
    dateRow: { flexDirection: "row", gap: 10 },
    // Icon pill: square until it carries a picked date, then hugs it.
    compactButton: { flex: 0, minWidth: 56, paddingHorizontal: 16 },
    dateButton: {
      flex: 1,
      height: 48,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 10,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.softChipBg,
    },
    dateButtonActive: {
      backgroundColor: colors.chipActiveBg,
    },
    dateButtonText: {
      color: colors.softChipInk,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    dateButtonTextActive: {
      color: colors.chipActiveInk,
      fontFamily: designTokens.font.semibold,
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
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.softChipBg,
    },
    cancelButtonText: {
      color: colors.softChipInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    saveButton: {
      flex: 1,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.primaryButtonBg,
    },
    // Detail sheet: Cancel and Save share the row 1 : 1.4, like the loan sheet.
    sheetCancel: { flex: 1, paddingHorizontal: 0 },
    sheetSave: { flex: 1.4 },
    saveButtonDisabled: { opacity: 0.4 },
    saveButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    saveButtonText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
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
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.groupBorder,
      backgroundColor: colors.groupBg,
    },
    numberKey: { flex: 1 },
    actionKey: { width: "100%", flex: 1 },
    clearKey: {
      borderColor: colors.softChipBg,
      backgroundColor: colors.softChipBg,
    },
    operatorKey: {
      borderColor: colors.primaryButtonBg,
      backgroundColor: colors.primaryButtonBg,
    },
    operatorKeyPressed: {
      opacity: 0.85,
    },
    operatorKeyText: { color: colors.primaryButtonInk },
    keyPressed: {
      backgroundColor: colors.softChipBg,
    },
    keyText: {
      color: colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 22,
      lineHeight: 28,
      fontVariant: ["tabular-nums"],
    },
    pressed: { opacity: 0.75 },
    errorText: {
      color: colors.negative,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
  });
}
