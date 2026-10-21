import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { RecurringFrequency } from "@trackingPortal/api/models/RecurringRuleModel";
import ScalarCalendar from "@trackingPortal/components/ScalarCalendar";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import {
  clampsInShortMonths,
  ordinal,
} from "@trackingPortal/db/services/RecurringDataService";
import { designTokens } from "@trackingPortal/themes/designTokens";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type RepeatChoice = RecurringFrequency | "never";

interface RepeatPickerProps {
  visible: boolean;
  /** Start date the options are read from ("On the 31st"). */
  startDate: Date;
  frequency: RepeatChoice;
  endDate: Date | null;
  /** The start comes back too: it can be changed here and becomes the form's date. */
  onDone: (frequency: RepeatChoice, endDate: Date | null, startDate: Date) => void;
  onCancel: () => void;
}

/**
 * Second sheet over the add form: how often an entry repeats and when it
 * stops. Same chrome as the calendar sheet.
 */
export default function RepeatPicker({
  visible,
  startDate,
  frequency,
  endDate,
  onDone,
  onCancel,
}: RepeatPickerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [choice, setChoice] = useState<RepeatChoice>(frequency);
  const [ends, setEnds] = useState<Date | null>(endDate);
  const [starts, setStarts] = useState<Date>(startDate);
  const [calendarFor, setCalendarFor] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (!visible) return;
    setChoice(frequency);
    setEnds(endDate);
    setStarts(startDate);
  }, [visible, frequency, endDate, startDate]);

  const start = dayjs(starts);
  const options: { value: RepeatChoice; label: string; detail?: string }[] = [
    { value: "never", label: "Never" },
    { value: "weekly", label: "Weekly", detail: `Every ${start.format("dddd")}` },
    { value: "monthly", label: "Monthly", detail: `On the ${ordinal(start.date())}` },
    { value: "yearly", label: "Yearly", detail: `Every ${start.format("D MMM")}` },
  ];
  const repeating = choice !== "never";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Repeat</Text>
            <Pressable
              accessibilityLabel="Close"
              onPress={onCancel}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.card}>
            {options.map((option, index) => {
              const selected = option.value === choice;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setChoice(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    index < options.length - 1 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  {option.detail ? (
                    <Text style={styles.rowDetail}>{option.detail}</Text>
                  ) : null}
                  <View style={styles.check}>
                    {selected && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.brand} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {choice === "monthly" && clampsInShortMonths("monthly", starts) && (
            <Text style={styles.hint}>On the last day in shorter months.</Text>
          )}

          {repeating && (
            <>
              {/* Every option is counted from this date: pick the 1st for "On the 1st". */}
              <Text style={styles.capsLabel}>STARTS</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Starts ${start.format("D MMMM YYYY")}`}
                onPress={() => setCalendarFor("start")}
                style={({ pressed }) => [
                  styles.endsButton,
                  styles.startsButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={17}
                  color={colors.softChipInk}
                />
                <Text numberOfLines={1} style={styles.endsText}>
                  {start.isSame(dayjs(), "day")
                    ? `Today · ${start.format("D MMM YYYY")}`
                    : start.format("ddd, D MMM YYYY")}
                </Text>
              </Pressable>
              {start.isAfter(dayjs(), "day") && (
                <Text style={styles.hint}>First entry on {start.format("D MMM")}.</Text>
              )}

              <Text style={styles.capsLabel}>ENDS</Text>
              <View style={styles.endsRow}>
                <Pressable
                  onPress={() => setEnds(null)}
                  style={({ pressed }) => [
                    styles.endsButton,
                    !ends && styles.endsButtonActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.endsText, !ends && styles.endsTextActive]}>Never</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCalendarFor("end")}
                  style={({ pressed }) => [
                    styles.endsButton,
                    ends && styles.endsButtonActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.endsText, ends && styles.endsTextActive]}
                  >
                    {ends ? `Until ${dayjs(ends).format("D MMM YYYY")}` : "On date"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => onDone(choice, repeating ? ends : null, starts)}
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>

      <ScalarCalendar
        visible={calendarFor !== null}
        date={
          calendarFor === "start" ? starts : ends ?? start.add(1, "year").toDate()
        }
        title={calendarFor === "start" ? "Repeat starts" : "Repeat ends"}
        onConfirm={(picked) => {
          if (calendarFor === "start") {
            setStarts(picked);
            // An end before the start would leave the rule with no entries.
            if (ends && dayjs(ends).isBefore(picked, "day")) setEnds(picked);
          } else {
            setEnds(dayjs(picked).isBefore(start, "day") ? start.toDate() : picked);
          }
          setCalendarFor(null);
        }}
        onCancel={() => setCalendarFor(null)}
      />
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: `${colors.backdrop}CC`,
    },
    sheet: {
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      borderTopLeftRadius: designTokens.radius.lg,
      borderTopRightRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    handle: {
      width: 40,
      height: 4,
      alignSelf: "center",
      marginBottom: 2,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 20,
      lineHeight: 26,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
    },
    card: {
      overflow: "hidden",
      borderRadius: designTokens.radius.group,
      borderWidth: 1,
      borderColor: colors.groupBorder,
      backgroundColor: colors.groupBg,
    },
    row: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.rowDivider,
    },
    rowLabel: {
      flex: 1,
      color: colors.sheetText,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
    },
    rowDetail: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 14,
    },
    check: { width: 20, alignItems: "flex-end" },
    hint: {
      marginTop: -4,
      paddingHorizontal: 6,
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    capsLabel: {
      marginTop: 4,
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
    },
    endsRow: { flexDirection: "row", gap: 10 },
    endsButton: {
      flex: 1,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.softChipBg,
    },
    endsButtonActive: { backgroundColor: colors.chipActiveBg },
    endsText: {
      color: colors.softChipInk,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
    },
    startsButton: { flex: 0, flexDirection: "row", gap: 8 },
    endsTextActive: {
      color: colors.chipActiveInk,
      fontFamily: designTokens.font.semibold,
    },
    done: {
      height: 54,
      marginTop: 6,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.primaryButtonBg,
    },
    doneText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    pressed: { opacity: 0.75 },
  });
}
