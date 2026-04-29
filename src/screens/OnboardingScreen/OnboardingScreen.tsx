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
import { colors } from '@trackingPortal/themes/colors';

const SLIDES = [
  {
    id: 'slide-1',
    title: 'Track your money effortlessly',
    subtitle: 'See where your money goes, instantly',
    icon: <MaterialCommunityIcons name="wallet-outline" size={80} color={colors.primary} />,
  },
  {
    id: 'slide-2',
    title: 'Understand your spending',
    subtitle: 'Smart insights & category breakdown',
    icon: <MaterialCommunityIcons name="chart-pie" size={80} color={colors.primary} />,
  },
  {
    id: 'slide-3',
    title: 'Add income or expense in seconds',
    subtitle: 'Start building your financial habit today',
    icon: <MaterialCommunityIcons name="plus-circle-outline" size={80} color={colors.primary} />,
  },
  {
    id: 'slide-4',
    title: 'Works Offline',
    subtitle: 'Add expenses anytime, even without internet. Your data syncs automatically when you\'re back online.',
    icon: <MaterialCommunityIcons name="cloud-off-outline" size={80} color={colors.primary} />,
  },
] as const;

const viewabilityConfig = {itemVisiblePercentThreshold: 65};

interface OnboardingScreenProps {
  onFinish: () => void | Promise<void>;
}

type Slide = (typeof SLIDES)[number];

const {width} = Dimensions.get('window');

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({onFinish}) => {
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
  }, [currentIndex, onFinish]);

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
    ({viewableItems}: {viewableItems: Array<ViewToken>}) => {
      const nextIndex = viewableItems?.[0]?.index;
      if (typeof nextIndex === 'number') {
        setCurrentIndex(nextIndex);
      }
    },
  ).current;

  const buttonLabel = useMemo(
    () => (currentIndex === SLIDES.length - 1 ? 'Continue' : 'Next'),
    [currentIndex],
  );

  return (
    <View style={styles.container}>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slider: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 20,
    paddingTop: 10,
  },
  progressRail: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  progressDot: {
    width: (width - 160) / SLIDES.length,
    maxWidth: 72,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: ((width - 160) / SLIDES.length) * 1.3,
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(0, 229, 180, 0.4)',
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: {width: 0, height: 14},
    shadowRadius: 28,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default OnboardingScreen;

