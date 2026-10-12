import React from "react";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Light mode backdrop: a cool blue-grey wash with soft white and periwinkle
 * glows. Blob positions are fractions of the full screen; radii follow CSS
 * `radial-gradient(circle at …)` (stop % of the farthest-corner distance).
 */
const BLOBS = [
  { x: 0.08, y: 0.04, color: "#FFFFFF", opacity: 0.95, stop: 0.38 },
  { x: 0.96, y: 0.2, color: "#7A94C4", opacity: 0.7, stop: 0.4 },
  { x: 0, y: 0.58, color: "#96ACD4", opacity: 0.65, stop: 0.38 },
  { x: 0.7, y: 0.5, color: "#FFFFFF", opacity: 0.85, stop: 0.34 },
  { x: 1, y: 0.92, color: "#7A94C4", opacity: 0.55, stop: 0.4 },
];

type Props = {
  width: number;
  height: number;
  /** Height of the full screen the glows are laid out against. */
  screenHeight?: number;
};

export default function LightGlow({ width, height, screenHeight = height }: Props) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="lightBase" x1="0" y1="0" x2="0" y2={screenHeight} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E4E9F2" />
          <Stop offset="0.45" stopColor="#EDF0F5" />
          <Stop offset="1" stopColor="#F4F6F9" />
        </LinearGradient>
        {BLOBS.map((b, i) => {
          const cx = b.x * width;
          const cy = b.y * screenHeight;
          const fx = Math.max(cx, width - cx);
          const fy = Math.max(cy, screenHeight - cy);
          const r = Math.sqrt(fx * fx + fy * fy) * b.stop;
          return (
            <RadialGradient
              key={i}
              id={`lightBlob${i}`}
              cx={cx}
              cy={cy}
              r={r}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          );
        })}
      </Defs>
      <Rect width={width} height={height} fill="url(#lightBase)" />
      {BLOBS.map((_, i) => (
        <Rect key={i} width={width} height={height} fill={`url(#lightBlob${i})`} />
      ))}
    </Svg>
  );
}
