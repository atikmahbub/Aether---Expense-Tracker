import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.panel,
          paddingTop: insets.top,
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
                backgroundColor: colors.background,
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
              backgroundColor: colors.background,
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
