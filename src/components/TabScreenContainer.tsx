import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomAppBar } from "@trackingPortal/components";
import { darkTheme } from "@trackingPortal/themes/darkTheme";

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: darkTheme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <CustomAppBar />

      {/* 🔥 KEY FIX: Keyboard + Bottom Safe Area */}
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
                backgroundColor: theme.colors.background,
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
              backgroundColor: theme.colors.background,
              paddingBottom: 100, // Reduced for Android to avoid gap
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
