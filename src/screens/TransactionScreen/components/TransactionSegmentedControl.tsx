import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@trackingPortal/themes/colors';

interface SegmentedControlProps {
  options: string[];
  selectedOption: string;
  onOptionPress: (option: string) => void;
  containerStyle?: any;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onOptionPress,
  containerStyle,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const containerPadding = 4;
  const segmentWidth = (dimensions.width - (containerPadding * 2)) / options.length;
  
  const selectedIndex = options.indexOf(selectedOption);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  useEffect(() => {
    if (dimensions.width > 0) {
      translateX.value = withSpring(selectedIndex * segmentWidth, {
        damping: 20,
        stiffness: 400,
        mass: 0.8,
      });
    }
  }, [selectedIndex, segmentWidth, dimensions.width]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: segmentWidth,
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  const handlePress = (option: string) => {
    if (option === selectedOption) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Subtle scale up on change
    scale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    
    onOptionPress(option);
  };

  return (
    <View 
      style={[styles.container, containerStyle]} 
      onLayout={onLayout}
    >
      {dimensions.width > 0 && (
        <Animated.View
          style={[
            styles.activeIndicator,
            animatedIndicatorStyle,
          ]}
        />
      )}
      {options.map((option) => {
        const isActive = selectedOption === option;
        return (
          <Pressable
            key={option}
            onPress={() => handlePress(option)}
            style={styles.segment}
          >
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.surface, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.primary,
  },
  inactiveLabel: {
    color: colors.subText,
  },
});

export default SegmentedControl;
