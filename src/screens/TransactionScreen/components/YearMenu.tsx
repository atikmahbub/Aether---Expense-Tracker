import React, {useMemo} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {FadeIn, FadeOut, Keyframe} from 'react-native-reanimated';
import {MaterialCommunityIcons} from '@expo/vector-icons';

import {useAppTheme} from '@trackingPortal/contexts/ThemeContext';
import {designTokens} from '@trackingPortal/themes/designTokens';
import {selectionHaptic} from '@trackingPortal/utils/haptic';

export interface MenuAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  anchor: MenuAnchor | null;
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
  onClose: () => void;
}

const MENU_WIDTH = 176;
const ROW_HEIGHT = 44;
const MAX_VISIBLE_ROWS = 6;
const GAP = 8;

// iOS pull-down menus grow out of their button, so scale from the top-right
// corner (the year pill sits on the right edge).
const enter = new Keyframe({
  0: {opacity: 0, transform: [{scale: 0.6}]},
  100: {opacity: 1, transform: [{scale: 1}]},
}).duration(200);

const exit = new Keyframe({
  0: {opacity: 1, transform: [{scale: 1}]},
  100: {opacity: 0, transform: [{scale: 0.85}]},
}).duration(140);

/** Anchored year pull-down, in the style of an iOS context menu. */
const YearMenu: React.FC<Props> = ({
  visible,
  anchor,
  years,
  selectedYear,
  onSelect,
  onClose,
}) => {
  const {colors, isDark} = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const {width: screenWidth} = useWindowDimensions();

  if (!anchor) return null;

  const right = Math.max(16, screenWidth - (anchor.x + anchor.width));
  const top = anchor.y + anchor.height + GAP;
  const listHeight = Math.min(years.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(140)}
        style={[StyleSheet.absoluteFill, styles.scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      {visible ? (
        <Animated.View
          entering={enter}
          exiting={exit}
          style={[
            styles.menu,
            {top, right, transformOrigin: 'top right'},
          ]}>
          <ScrollView
            style={{height: listHeight}}
            bounces={years.length > MAX_VISIBLE_ROWS}
            showsVerticalScrollIndicator={false}>
            {years.map((yr, i) => {
              const active = yr === selectedYear;
              return (
                <Pressable
                  key={yr}
                  onPress={() => {
                    if (!active) selectionHaptic();
                    onSelect(yr);
                  }}
                  style={({pressed}) => [
                    styles.row,
                    i > 0 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}>
                  <View style={styles.check}>
                    {active ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={17}
                        color={colors.textPrimary}
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>
                    {yr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}
    </Modal>
  );
};

function makeStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  isDark: boolean,
) {
  return StyleSheet.create({
    scrim: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(27,41,64,0.12)',
    },
    menu: {
      position: 'absolute',
      width: MENU_WIDTH,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.listCardBorder,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.45 : 0.14,
      shadowRadius: 24,
      shadowOffset: {width: 0, height: 12},
      elevation: 12,
    },
    row: {
      height: ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.rowDivider,
    },
    rowPressed: {
      backgroundColor: colors.softChipBg,
    },
    check: {
      width: 24,
      alignItems: 'flex-start',
    },
    rowText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: designTokens.font.medium,
      fontVariant: ['tabular-nums'],
    },
    rowTextActive: {
      fontFamily: designTokens.font.semibold,
    },
  });
}

export default YearMenu;
