// src/components/GlassCard.tsx
import { BlurView } from "expo-blur";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  blurIntensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  padding = 24,
  blurIntensity = 20,
}) => {
  return (
    <BlurView
      intensity={blurIntensity}
      tint="dark"
      style={[styles.container, styles.shadow, style]}
    >
      <View style={[styles.inner, { padding }, contentStyle]}>{children}</View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(161, 250, 255, 0.05)",
    overflow: "hidden",
    backgroundColor: "#1b2026",
  },
  inner: {
    gap: 0,
  },
  shadow: {
    shadowColor: "rgba(161, 250, 255, 0.08)",
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});

export default GlassCard;
