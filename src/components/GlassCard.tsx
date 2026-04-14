// src/components/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  blurIntensity?: number;
  onPress?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  padding = 24,
  blurIntensity = 20,
  onPress,
}) => {
  const Container = Platform.OS === "ios" ? BlurView : View;
  const AnimatedContainer = Animated.createAnimatedComponent(Container);
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handleMainPress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const flattenedStyle = StyleSheet.flatten(style);
  const wrapperStyle = {
    flex: flattenedStyle?.flex,
    width: flattenedStyle?.width,
    margin: flattenedStyle?.margin,
    marginTop: flattenedStyle?.marginTop,
    marginBottom: flattenedStyle?.marginBottom,
    marginLeft: flattenedStyle?.marginLeft,
    marginRight: flattenedStyle?.marginRight,
    marginHorizontal: flattenedStyle?.marginHorizontal,
    marginVertical: flattenedStyle?.marginVertical,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleMainPress}
      disabled={!onPress}
      style={wrapperStyle}
    >
      <AnimatedContainer
        entering={FadeIn.duration(400)}
        intensity={blurIntensity}
        tint="dark"
        style={[styles.container, styles.shadow, style, animatedStyle]}
      >
        {/* Subtle Gradient Overlay */}
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%">
            <Defs>
              <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="white" stopOpacity="0.02" />
                <Stop offset="1" stopColor="black" stopOpacity="0.2" />
              </SvgGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grad)" />
          </Svg>
        </View>

        {/* Inner Highlight Border (very subtle) */}
        <View style={[styles.innerHighlight, StyleSheet.absoluteFill]} pointerEvents="none" />

        <View style={[styles.inner, { padding }, contentStyle]}>{children}</View>
      </AnimatedContainer>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    backgroundColor: "rgba(27, 32, 38, 0.4)",
  },
  inner: {
    gap: 0,
  },
  innerHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
  },
  shadow: {
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});

export default GlassCard;
