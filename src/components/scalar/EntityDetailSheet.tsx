import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import BaseBottomSheet from "@trackingPortal/components/BaseBottomSheet";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { ComponentProps, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface EntityDetailBadge {
  label: string;
  tone?: "neutral" | "negative";
}

interface EntityDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  icon: IconName;
  /** Tile fill behind the icon; defaults to the sheet's soft fill. */
  iconTile?: string;
  iconColor?: string;
  title: string;
  meta: string;
  /** Summary card: a label over one large figure, optional badge and footer. */
  figureLabel: string;
  figure: string;
  badge?: EntityDetailBadge;
  cardFooter?: React.ReactNode;
  children: React.ReactNode;
  /** Destructive text link under the form, e.g. "Delete transaction". */
  deleteLabel?: string;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  /** Replaces the whole body while set (an in-sheet confirmation). */
  takeover?: React.ReactNode;
}

/**
 * Detail sheet shell shared by entity editors (wallet entries, investments):
 * header with close, summary card, then the editor and a delete link. Same
 * look as the loan detail sheet from the Naval redesign.
 */
export default function EntityDetailSheet(props: EntityDetailSheetProps) {
  // While closing, keep rendering the last open content so the sheet slides
  // away with it instead of as an empty panel.
  const last = useRef(props);
  if (props.visible) last.current = props;
  const shown = props.visible ? props : { ...last.current, visible: false, onClose: props.onClose };
  const hasContent = props.visible || last.current.visible;
  return <EntityDetailSheetView {...shown} hasContent={hasContent} />;
}

function EntityDetailSheetView({
  visible,
  hasContent,
  onClose,
  icon,
  iconTile,
  iconColor,
  title,
  meta,
  figureLabel,
  figure,
  badge,
  cardFooter,
  children,
  deleteLabel,
  onDelete,
  deleteDisabled,
  takeover,
}: EntityDetailSheetProps & { hasContent: boolean }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <BaseBottomSheet index={visible ? 1 : -1} onClose={onClose}>
      {hasContent && takeover}
      {hasContent && !takeover && (
        <View style={styles.root}>
          <View style={styles.header}>
            <View style={[styles.tile, iconTile ? { backgroundColor: iconTile } : null]}>
              <MaterialCommunityIcons
                name={icon}
                size={20}
                color={iconColor ?? colors.sheetText}
              />
            </View>
            <View style={styles.headerText}>
              <Text numberOfLines={1} style={styles.title}>{title}</Text>
              <Text numberOfLines={1} style={styles.meta}>{meta}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.sheetText} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardFigure}>
                <Text style={styles.muted}>{figureLabel}</Text>
                <ScalarAmountText style={styles.figure}>{figure}</ScalarAmountText>
              </View>
              {badge && (
                <Text
                  style={[
                    styles.badge,
                    badge.tone === "negative" ? styles.badgeNegative : styles.badgeNeutral,
                  ]}
                >
                  {badge.label}
                </Text>
              )}
            </View>
            {cardFooter}
          </View>

          {children}

          {deleteLabel && onDelete && (
            <Pressable
              accessibilityRole="button"
              disabled={deleteDisabled}
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
            >
              <Text style={styles.deleteText}>{deleteLabel}</Text>
            </Pressable>
          )}
        </View>
      )}
    </BaseBottomSheet>
  );
}

/** Destructive text link for a detail sheet, placed below the form footer. */
export function DetailDeleteLink({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
    >
      <Text style={styles.deleteText}>{label}</Text>
    </Pressable>
  );
}

/** Muted 13px caption, for card footers. */
export function useDetailCaptionStyle() {
  const { colors } = useAppTheme();
  return useMemo(
    () => ({
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    }),
    [colors],
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], isDark: boolean) {
  const soft = isDark ? colors.softChipBg : colors.dockActiveBg;
  return StyleSheet.create({
    root: { gap: 16, paddingTop: 2 },
    pressed: { opacity: 0.75 },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    tile: {
      width: 48,
      height: 48,
      borderRadius: 999,
      backgroundColor: soft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1, gap: 2, minWidth: 0 },
    title: {
      color: colors.sheetText,
      fontFamily: designTokens.font.semibold,
      fontSize: 18,
    },
    meta: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: soft,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      borderRadius: 24,
      padding: 18,
      gap: 14,
      backgroundColor: isDark ? colors.groupBg : colors.cardBg,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(45,66,99,0.08)",
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    cardFigure: { gap: 4, flexShrink: 1 },
    muted: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
    },
    figure: {
      color: colors.sheetText,
      fontFamily: designTokens.font.display,
      fontSize: 30,
      letterSpacing: -0.6,
    },
    badge: {
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
    },
    badgeNegative: {
      color: colors.negative,
      backgroundColor: isDark ? "rgba(240,98,63,0.14)" : "rgba(200,75,49,0.10)",
    },
    badgeNeutral: { color: colors.sheetText, backgroundColor: soft },
    deleteLink: { height: 44, alignItems: "center", justifyContent: "center" },
    deleteText: {
      color: colors.negative,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
    },
  });
}
