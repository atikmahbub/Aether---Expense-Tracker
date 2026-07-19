import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomAppBar } from "@trackingPortal/components";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

const TAB_CONTENT_BOTTOM_PADDING = 24; // slightly increased

import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
};

const TabScreenContainer: React.FC<Props> = ({ children }) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {isDark && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="screenAmbient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#191B20" stopOpacity="0.65" />
                <Stop offset="0.35" stopColor={colors.background} stopOpacity="1" />
                <Stop offset="1" stopColor={colors.deepest} stopOpacity="1" />
              </LinearGradient>
              <RadialGradient id="topSheen" cx="50%" cy="-8%" rx="75%" ry="38%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.055" />
                <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.015" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#screenAmbient)" />
            <Rect width="100%" height="100%" fill="url(#topSheen)" />
          </Svg>
        </View>
      )}
      <CustomAppBar />

      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={80}
        >
          <Animated.View
            entering={FadeInDown.duration(280).easing(Easing.out(Easing.quad))}
            style={[
              styles.content,
              {
                backgroundColor: isDark ? 'transparent' : colors.background,
                paddingBottom: insets.bottom + 90,
              },
            ]}
          >
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      ) : (
        <Animated.View
          entering={FadeInDown.duration(280).easing(Easing.out(Easing.quad))}
          style={[
            styles.content,
            {
              backgroundColor: isDark ? 'transparent' : colors.background,
              paddingBottom: 100,
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default React.memo(TabScreenContainer);
export { TAB_CONTENT_BOTTOM_PADDING };
