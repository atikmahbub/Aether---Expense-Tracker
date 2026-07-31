import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { OnboardingSlide } from '@trackingPortal/components';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

const viewabilityConfig = {itemVisiblePercentThreshold: 65};

interface OnboardingScreenProps {
  onFinish: () => void | Promise<void>;
}

const {width} = Dimensions.get('window');

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({onFinish}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const SLIDES = useMemo(() => [
    {
      id: 'slide-1',
      title: 'Track your money effortlessly',
      subtitle: 'See where your money goes, instantly',
      icon: <MaterialCommunityIcons name="wallet" size={34} color={colors.onBrand} />,
    },
    {
      id: 'slide-2',
      title: 'Understand your spending',
      subtitle: 'Smart insights & category breakdown',
      icon: <MaterialCommunityIcons name="chart-donut" size={34} color={colors.onBrand} />,
    },
    {
      id: 'slide-3',
      title: 'Add income or expense in seconds',
      subtitle: 'Start building your financial habit today',
      icon: <MaterialCommunityIcons name="plus" size={38} color={colors.onBrand} />,
    },
    {
      id: 'slide-4',
      title: 'Works Offline',
      subtitle: "Add expenses anytime, even without internet. Your data syncs automatically when you're back online.",
      icon: <MaterialCommunityIcons name="cloud-check" size={34} color={colors.onBrand} />,
    },
  ], [colors.onBrand]);

  type Slide = (typeof SLIDES)[number];

  const listRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const handleAdvance = useCallback(async () => {
    const isLast = currentIndex === SLIDES.length - 1;
    if (isLast) {
      await onFinish();
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToIndex({index: nextIndex, animated: true});
  }, [currentIndex, onFinish, SLIDES.length]);

  const renderItem = useCallback(({item}: {item: Slide}) => {
    return (
      <OnboardingSlide
        title={item.title}
        subtitle={item.subtitle}
        icon={item.icon}
      />
    );
  }, []);

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const nextIndex = viewableItems?.[0]?.index;
      if (typeof nextIndex === 'number') {
        setCurrentIndex(nextIndex);
      }
    },
  ).current;

  const buttonLabel = useMemo(
    () => (currentIndex === SLIDES.length - 1 ? 'Continue' : 'Next'),
    [currentIndex, SLIDES.length],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.brandRow, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>S</Text>
        </View>
        <Text style={styles.brandName}>Scalar</Text>
      </View>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{flexGrow: 1}}
        style={styles.slider}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.progressRail}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.progressDot,
                index === currentIndex ? styles.progressDotActive :
                index < currentIndex ? styles.progressDotCompleted : null,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.primaryButton}
          onPress={handleAdvance}>
          <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  const SLIDE_COUNT = 4;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    slider: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 20,
      gap: 16,
      paddingTop: 12,
    },
    brandRow: {
      minHeight: 64,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandMark: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.brand,
    },
    brandMarkText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 17,
      fontWeight: '700',
    },
    brandName: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 18,
      fontWeight: '700',
    },
    progressRail: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    progressDot: {
      width: (width - 160) / SLIDE_COUNT,
      maxWidth: 72,
      height: 5,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.surfaceSunken,
    },
    progressDotActive: {
      backgroundColor: colors.brand,
      width: ((width - 160) / SLIDE_COUNT) * 1.3,
    },
    progressDotCompleted: {
      backgroundColor: colors.brandWash,
    },
    primaryButton: {
      height: 54,
      borderRadius: designTokens.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brand,
    },
    primaryButtonText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export default OnboardingScreen;
