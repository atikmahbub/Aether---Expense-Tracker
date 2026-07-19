import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

/**
 * Green ambient wash for hero/summary cards, dark mode only. Render as the
 * first child of a CommonCard. The rect carries its own corner radius because
 * CommonCard doesn't clip children (overflow:'hidden' would kill its iOS shadow).
 */
const HeroGlow: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  if (!isDark) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.18" />
            <Stop offset="0.48" stopColor={colors.primary} stopOpacity="0.035" />
            <Stop offset="1" stopColor={colors.cardBg} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          rx={designTokens.radius.xl}
          fill="url(#heroGlow)"
        />
      </Svg>
    </View>
  );
};

export default HeroGlow;
