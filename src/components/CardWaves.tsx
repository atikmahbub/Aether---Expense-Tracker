import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Barely-there decorative sheen rendered behind hero card content in dark mode:
 * a soft emerald corner glow plus two hairline arcs. Purely visual — absolutely
 * positioned, ignores touches. Keep opacities whisper-low; this should be felt,
 * not seen.
 */
const CardWaves: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <RadialGradient id="cardSheen" cx="88%" cy="0%" rx="70%" ry="80%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.04" />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.012" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#cardSheen)" />
      <Path
        d="M-20 190 C 90 120, 240 210, 420 60"
        stroke="rgba(255, 255, 255, 0.045)"
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M-20 230 C 110 160, 260 250, 430 100"
        stroke="rgba(255, 255, 255, 0.03)"
        strokeWidth="1.2"
        fill="none"
      />
    </Svg>
  </View>
);

export default CardWaves;
