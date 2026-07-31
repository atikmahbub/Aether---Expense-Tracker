import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import dayjs, { Dayjs } from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ScalarCalendarProps {
  visible: boolean;
  date: Date;
  title?: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ScalarCalendar({
  visible,
  date,
  title = "Choose date",
  onConfirm,
  onCancel,
}: ScalarCalendarProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<Dayjs>(dayjs(date));
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(
    dayjs(date).startOf("month"),
  );

  useEffect(() => {
    if (!visible) return;
    const next = dayjs(date);
    setSelected(next);
    setVisibleMonth(next.startOf("month"));
  }, [date, visible]);

  const days = useMemo(() => {
    const first = visibleMonth.startOf("month");
    const gridStart = first.subtract(first.day(), "day");
    return Array.from({ length: 42 }, (_, index) =>
      gridStart.add(index, "day"),
    );
  }, [visibleMonth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.selectedDate}>
                {selected.format("dddd, D MMMM YYYY")}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close calendar"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() =>
                setVisibleMonth((current) => current.subtract(1, "month"))
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
            <Text style={styles.monthLabel}>
              {visibleMonth.format("MMMM YYYY")}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() =>
                setVisibleMonth((current) => current.add(1, "month"))
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {days.map((day) => {
              const active = day.isSame(selected, "day");
              const today = day.isSame(dayjs(), "day");
              const inMonth = day.month() === visibleMonth.month();
              return (
                <View key={day.format("YYYY-MM-DD")} style={styles.dayCell}>
                  <Pressable
                    onPress={() => {
                      setSelected(day);
                      if (!inMonth) setVisibleMonth(day.startOf("month"));
                    }}
                    style={({ pressed }) => [
                      styles.day,
                      active && styles.dayActive,
                      today && !active && styles.dayToday,
                      pressed && !active && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayTextOutside,
                        active && styles.dayTextActive,
                      ]}
                    >
                      {day.format("D")}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                const today = dayjs();
                setSelected(today);
                setVisibleMonth(today.startOf("month"));
              }}
              style={({ pressed }) => [
                styles.todayButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.todayText}>Today</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(selected.toDate())}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.confirmPressed,
              ]}
            >
              <Text style={styles.confirmText}>Confirm date</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
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
      marginBottom: 14,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700",
    },
    selectedDate: {
      marginTop: 2,
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
    },
    monthRow: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      marginBottom: 4,
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthLabel: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontWeight: "700",
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
    },
    weekRow: { flexDirection: "row" },
    weekday: {
      width: "14.2857%",
      paddingVertical: 8,
      textAlign: "center",
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontSize: 11,
      fontWeight: "700",
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
      width: "14.2857%",
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    day: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
    },
    dayActive: { backgroundColor: colors.brand },
    dayToday: {
      borderWidth: 1.5,
      borderColor: colors.brand,
    },
    dayText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    dayTextOutside: { color: colors.textTertiary },
    dayTextActive: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    todayButton: {
      height: 52,
      paddingHorizontal: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    todayText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    confirmButton: {
      flex: 1,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.brand,
    },
    confirmPressed: { backgroundColor: colors.brandText },
    confirmText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 15,
      fontWeight: "700",
    },
    pressed: { backgroundColor: colors.surfaceSunken },
  });
}
