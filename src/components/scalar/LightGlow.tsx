import React from "react";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * The backdrop glass surfaces sit on. Light: a cool blue-grey wash with soft
 * white and periwinkle glows. Dark: deep navy with faint periwinkle glows, so
 * frosted surfaces still have something to pick up. Blob positions are fractions of the full screen; radii follow CSS
 * `radial-gradient(circle at …)` (stop % of the farthest-corner distance).
 */
const LIGHT_BASE = ["#E4E9F2", "#EDF0F5", "#F4F6F9"];
const DARK_BASE = ["#22344F", "#16223A", "#0E1624"];

const LIGHT_BLOBS = [
  { x: 0.08, y: 0.04, color: "#FFFFFF", opacity: 0.95, stop: 0.38 },
  { x: 0.96, y: 0.2, color: "#7A94C4", opacity: 0.7, stop: 0.4 },
  { x: 0, y: 0.58, color: "#96ACD4", opacity: 0.65, stop: 0.38 },
  { x: 0.7, y: 0.5, color: "#FFFFFF", opacity: 0.85, stop: 0.34 },
  { x: 1, y: 0.92, color: "#7A94C4", opacity: 0.55, stop: 0.4 },
];

const DARK_BLOBS = [
  { x: 0.08, y: 0.04, color: "#7A94C4", opacity: 0.28, stop: 0.38 },
  { x: 0.96, y: 0.2, color: "#4A6390", opacity: 0.45, stop: 0.4 },
  { x: 0, y: 0.58, color: "#4A6390", opacity: 0.32, stop: 0.38 },
  { x: 0.7, y: 0.5, color: "#7A94C4", opacity: 0.12, stop: 0.34 },
  { x: 1, y: 0.92, color: "#4A6390", opacity: 0.3, stop: 0.4 },
];

type Props = {
  width: number;
  height: number;
  /** Height of the full screen the glows are laid out against. */
  screenHeight?: number;
  dark?: boolean;
};

export default function LightGlow({ width, height, screenHeight = height, dark = false }: Props) {
  const base = dark ? DARK_BASE : LIGHT_BASE;
  const BLOBS = dark ? DARK_BLOBS : LIGHT_BLOBS;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="lightBase" x1="0" y1="0" x2="0" y2={screenHeight} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={base[0]} />
          <Stop offset="0.45" stopColor={base[1]} />
          <Stop offset="1" stopColor={base[2]} />
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
