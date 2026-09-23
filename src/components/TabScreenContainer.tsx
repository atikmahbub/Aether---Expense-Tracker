import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

const TAB_CONTENT_BOTTOM_PADDING = 24; // slightly increased

type Props = {
  children: React.ReactNode;
};

const TabScreenContainer: React.FC<Props> = ({ children }) => {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.safeArea,
        {
          // Matches the top of the hero tint, so nothing seams under the status
          // bar on Android while the screen fades in or overscrolls.
          backgroundColor: colors.heroGradTop,
        },
      ]}
    >
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
                backgroundColor: "transparent",
                paddingBottom: 0,
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
              backgroundColor: "transparent",
              paddingBottom: 0,
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
