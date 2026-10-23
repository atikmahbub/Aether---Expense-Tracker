import Constants from "expo-constants";
import BaseBottomSheet from "@trackingPortal/components/BaseBottomSheet";
import SheetCloseButton from "@trackingPortal/components/scalar/SheetCloseButton";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import useKeyboardHeight from "@trackingPortal/hooks/useKeyboardHeight";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

const FEEDBACK_EMAIL = "atikmahbub100@gmail.com";
const APP_VERSION =
  Constants.expoConfig?.extra?.displayVersion ?? Constants.expoConfig?.version ?? "";

type Kind = "bug" | "feature" | "other";
const KINDS: Kind[] = ["bug", "feature", "other"];

/** "Send feedback": a short form handed off to the email app. */
export default function FeedbackSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const keyboardOpen = useKeyboardHeight() > 0;
  const [kind, setKind] = useState<Kind>("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [focused, setFocused] = useState<"subject" | "description" | null>(null);
  const canSend = subject.trim().length > 0 && description.trim().length > 0;

  // Each opening starts from a blank Bug report.
  useEffect(() => {
    if (visible) {
      setKind("bug");
      setSubject("");
      setDescription("");
    }
  }, [visible]);

  const send = async () => {
    const device = `${Platform.OS} ${Platform.Version}`;
    const body = `${description.trim()}\n\n—\nScalar ${APP_VERSION} · ${device}`;
    const url =
      `mailto:${FEEDBACK_EMAIL}` +
      `?subject=${encodeURIComponent(`[${t(`feedback.${kind}`)}] ${subject.trim()}`)}` +
      `&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(url);
      onClose();
    } catch {
      Toast.show({ type: "error", text1: t("feedback.noEmailApp") });
    }
  };

  return (
    <BaseBottomSheet
      index={visible ? 0 : -1}
      onClose={onClose}
      // White paper in light mode, as with the Carry over sheet.
      backgroundColor={isDark ? colors.sheet : colors.listCardBg}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("feedback.title")}</Text>
          <SheetCloseButton onPress={onClose} />
        </View>

        <View style={styles.chips}>
          {KINDS.map((value) => {
            const active = value === kind;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setKind(value)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(`feedback.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t("feedback.subject")}
          placeholderTextColor={styles.placeholder.color}
          onFocus={() => setFocused("subject")}
          onBlur={() => setFocused(null)}
          returnKeyType="next"
          maxLength={120}
          style={[styles.field, styles.subject, focused === "subject" && styles.fieldFocused]}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("feedback.descriptionPlaceholder")}
          placeholderTextColor={styles.placeholder.color}
          onFocus={() => setFocused("description")}
          onBlur={() => setFocused(null)}
          multiline
          textAlignVertical="top"
          style={[
            styles.field,
            styles.description,
            // Shorter while typing so the actions stay above the keyboard.
            keyboardOpen && styles.descriptionCompact,
            focused === "description" && styles.fieldFocused,
          ]}
        />

        {!keyboardOpen && <Text style={styles.note}>{t("feedback.note")}</Text>}

        <View style={[styles.actions, keyboardOpen && styles.actionsCompact]}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>{t("common.cancel")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={send}
            style={({ pressed }) => [
              styles.button,
              styles.primary,
              !canSend && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>{t("feedback.send")}</Text>
          </Pressable>
        </View>
      </View>
    </BaseBottomSheet>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
    // BaseBottomSheet pads 22; the design sits 20 from the edge.
    content: { marginHorizontal: -2, gap: 16 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: {
      flex: 1,
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 18,
      lineHeight: 24,
    },
    chips: { flexDirection: "row", gap: 6 },
    chip: {
      height: 34,
      paddingHorizontal: 16,
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.dockActiveBg,
    },
    chipActive: { backgroundColor: colors.primaryButtonBg },
    chipText: {
      color: isDark ? "#C9CED8" : colors.sheetText,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    chipTextActive: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
    },
    field: {
      paddingHorizontal: 16,
      borderRadius: 16,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      backgroundColor: isDark ? colors.listCardBg : colors.sheet,
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
    },
    fieldFocused: {
      borderWidth: 1.5,
      borderColor: colors.primaryButtonBg,
      backgroundColor: colors.listCardBg,
    },
    subject: { height: 52 },
    description: { height: 138, paddingTop: 14, paddingBottom: 14, lineHeight: 22 },
    descriptionCompact: { height: 112 },
    placeholder: { color: isDark ? "#6B7282" : "#8A94A8" },
    note: {
      paddingHorizontal: 4,
      color: isDark ? colors.textMuted : colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
      lineHeight: 20,
    },
    // Same pair as SheetConfirm.
    actions: { paddingTop: 4, flexDirection: "row", gap: 10 },
    actionsCompact: { paddingTop: 0 },
    button: {
      flex: 1,
      height: 54,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    secondary: { backgroundColor: isDark ? colors.softChipBg : colors.dockActiveBg },
    secondaryText: {
      color: isDark ? colors.sheetText : colors.primaryButtonBg,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    primary: { backgroundColor: colors.primaryButtonBg },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
    disabled: { opacity: 0.35 },
    pressed: { opacity: 0.75 },
  });
}
