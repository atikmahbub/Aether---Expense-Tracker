import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import ScalarAmountText from '@trackingPortal/components/ScalarAmountText';
import { DotField, ScreenGradient, SpentRamp } from '@trackingPortal/components/scalar';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

const viewabilityConfig = { itemVisiblePercentThreshold: 65 };

interface OnboardingScreenProps {
  onFinish: () => void | Promise<void>;
}

type Colors = ReturnType<typeof useAppTheme>['colors'];

const SLIDES = [
  {
    id: 'track',
    title: 'Every taka, in one calm place.',
    body: 'Track spending, loans and investments against a monthly limit.',
  },
  {
    id: 'lend',
    title: 'Know who owes what.',
    body: 'Given and borrowed sit side by side, with due dates on every row.',
  },
  {
    id: 'offline',
    title: 'Works offline. Syncs later.',
    body: "Add entries without a connection. Your data syncs when you're back online.",
  },
] as const;

/** Deep green card the illustrations are built on — the real stat-card look. */
function DeepCard({ children, colors }: { children: React.ReactNode; colors: Colors }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={[illus.deep, { borderColor: colors.statBorder }]}
      onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="onbDeep" x1="0.33" y1="0" x2="0.67" y2="1">
              <Stop offset="0" stopColor={colors.statGradFrom} />
              <Stop offset="0.55" stopColor={colors.statGradMid} />
              <Stop offset="1" stopColor={colors.statGradTo} />
            </LinearGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#onbDeep)" />
        </Svg>
      )}
      {children}
    </View>
  );
}

function FloatCard({
  children,
  colors,
  isDark,
  style,
}: {
  children: React.ReactNode;
  colors: Colors;
  isDark: boolean;
  style: object;
}) {
  return (
    <View
      style={[
        illus.float,
        { backgroundColor: colors.sheet, borderColor: colors.sheetBorder },
        !isDark && illus.floatShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function LoanChip({
  colors,
  given,
  name,
  amount,
}: {
  colors: Colors;
  given: boolean;
  name: string;
  amount: string;
}) {
  return (
    <View style={illus.loanRow}>
      <View
        style={[
          illus.loanIcon,
          { backgroundColor: given ? colors.positiveTile : colors.negativeTile },
        ]}
      >
        <Text style={[illus.loanGlyph, { color: given ? colors.positive : colors.negative }]}>
          {given ? '↗' : '↙'}
        </Text>
      </View>
      <View style={{ gap: 1 }}>
        <Text style={[illus.loanName, { color: colors.sheetText }]}>{name}</Text>
        <ScalarAmountText
          style={[illus.loanAmount, { color: given ? colors.positive : colors.negative }]}
        >
          {amount}
        </ScalarAmountText>
      </View>
    </View>
  );
}

function Illustration({ index, colors, isDark }: { index: number; colors: Colors; isDark: boolean }) {
  const spentRatio = index === 2 ? 0.62 : 0.28;
  return (
    <View style={illus.stage}>
      <DeepCard colors={colors}>
        <Text style={[illus.deepLabel, { color: colors.statLabel }]}>
          {index === 1 ? 'Net position' : 'Spent in August'}
        </Text>
        <ScalarAmountText style={illus.deepAmount}>
          {index === 1 ? '৳16,261' : '৳19,856'}
        </ScalarAmountText>
        <View style={illus.split}>
          <View style={[illus.spent, { flex: spentRatio }]}>
            <SpentRamp from="rgba(255,255,255,0.02)" to="rgba(166,240,127,0.5)" />
            <View style={[illus.knob, { backgroundColor: colors.lime }]}>
              <Text style={illus.knobText}>{Math.round(spentRatio * 100)}%</Text>
            </View>
          </View>
          <View style={{ flex: 1 - spentRatio }}>
            <DotField color="rgba(255,255,255,0.22)" spacing={10} radius={2} />
          </View>
        </View>
      </DeepCard>

      <FloatCard colors={colors} isDark={isDark} style={illus.floatLeft}>
        {index === 2 ? (
          <View style={{ gap: 2 }}>
            <Text style={[illus.smallLabel, { color: colors.textMuted }]}>Saved offline</Text>
            <Text style={[illus.smallTitle, { color: colors.sheetText }]}>3 entries</Text>
          </View>
        ) : (
          <LoanChip colors={colors} given name="Loan to John" amount="+৳5,000" />
        )}
      </FloatCard>

      <FloatCard colors={colors} isDark={isDark} style={illus.floatRight}>
        {index === 1 ? (
          <LoanChip colors={colors} given={false} name="From Max" amount="−৳239" />
        ) : index === 2 ? (
          <View style={{ gap: 2 }}>
            <Text style={[illus.smallLabel, { color: colors.textMuted }]}>Sync</Text>
            <Text style={[illus.smallTitle, { color: colors.positive }]}>Up to date</Text>
          </View>
        ) : (
          <View style={{ gap: 2 }}>
            <Text style={[illus.smallLabel, { color: colors.textMuted }]}>Daily average</Text>
            <ScalarAmountText style={[illus.floatFigure, { color: colors.sheetText }]}>
              ৳641
            </ScalarAmountText>
          </View>
        )}
      </FloatCard>
    </View>
  );
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLast = currentIndex === SLIDES.length - 1;

  const handleAdvance = useCallback(async () => {
    if (isLast) {
      await onFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  }, [currentIndex, isLast, onFinish]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const nextIndex = viewableItems?.[0]?.index;
      if (typeof nextIndex === 'number') {
        setCurrentIndex(nextIndex);
      }
    },
  ).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenGradient />
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable accessibilityRole="button" onPress={onFinish} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        style={styles.slider}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width }]}>
            <Illustration index={index} colors={colors} isDark={isDark} />
            <View style={{ flex: 1 }} />
            <View style={styles.copy}>
              <View style={styles.pager}>
                {SLIDES.map((slide, dot) => (
                  <View
                    key={slide.id}
                    style={[styles.dot, dot === index && styles.dotActive]}
                  />
                ))}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) + 22 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={handleAdvance}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>{isLast ? 'Get started' : 'Next'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onFinish}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
};

const illus = StyleSheet.create({
  stage: { height: 360, marginTop: 8 },
  deep: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 24,
    padding: 22,
    gap: 6,
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  deepLabel: { fontFamily: designTokens.font.regular, fontSize: 13 },
  deepAmount: {
    color: '#FFFFFF',
    fontFamily: designTokens.font.display,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  split: { flexDirection: 'row', height: 40, marginTop: 10 },
  spent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
    overflow: 'hidden',
  },
  knob: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  knobText: { color: '#07110E', fontFamily: designTokens.font.display, fontSize: 10 },
  float: {
    position: 'absolute',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  floatShadow: Platform.select({
    ios: {
      shadowColor: '#143C2D',
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 8 },
    default: {},
  }) as object,
  floatLeft: { left: 0, top: 214, width: 196 },
  floatRight: { right: 0, top: 262, width: 170 },
  loanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loanIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  loanGlyph: { fontFamily: designTokens.font.bold, fontSize: 15 },
  loanName: { fontFamily: designTokens.font.semibold, fontSize: 13 },
  loanAmount: { fontFamily: designTokens.font.bold, fontSize: 13 },
  smallLabel: { fontFamily: designTokens.font.regular, fontSize: 12 },
  smallTitle: { fontFamily: designTokens.font.semibold, fontSize: 15 },
  floatFigure: { fontFamily: designTokens.font.display, fontSize: 18, lineHeight: 24 },
});

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.heroGradBottom },
    skipRow: {
      height: 44,
      paddingHorizontal: 22,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    skip: {
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 14,
      paddingHorizontal: 4,
    },
    slider: { flex: 1 },
    slide: { flex: 1, paddingHorizontal: 22 },
    copy: { gap: 12 },
    pager: { flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pagerIdle },
    dotActive: { width: 22, backgroundColor: colors.chipActiveBg },
    title: {
      color: colors.heroInk,
      fontFamily: designTokens.font.display,
      fontSize: 30,
      lineHeight: 35,
      letterSpacing: -0.75,
    },
    body: {
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    actions: { paddingHorizontal: 22, paddingTop: 26, gap: 10 },
    primary: {
      height: 56,
      borderRadius: designTokens.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryButtonBg,
    },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    secondary: {
      height: 56,
      borderRadius: designTokens.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.ghostButtonBorder,
      backgroundColor: colors.ghostButtonBg,
    },
    secondaryText: {
      color: colors.heroText,
      fontFamily: designTokens.font.medium,
      fontSize: 16,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}

export default OnboardingScreen;
