import React from "react";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * The backdrop glass surfaces sit on. Light: a cool blue-grey wash with soft
 * white and periwinkle glows. Dark: near-black with navy glows up top, so
 * frosted surfaces still have something to pick up. Blob positions are fractions of the full screen; radii follow CSS
 * `radial-gradient(circle at …)` (stop % of the farthest-corner distance).
 */
const LIGHT_BASE = ["#E4E9F2", "#EDF0F5", "#F4F6F9"];
const DARK_BASE = ["#04050A"];

const LIGHT_BLOBS = [
  { x: 0.08, y: 0.04, color: "#FFFFFF", opacity: 0.95, stop: 0.38 },
  { x: 0.96, y: 0.2, color: "#7A94C4", opacity: 0.7, stop: 0.4 },
  { x: 0, y: 0.58, color: "#96ACD4", opacity: 0.65, stop: 0.38 },
  { x: 0.7, y: 0.5, color: "#FFFFFF", opacity: 0.85, stop: 0.34 },
  { x: 1, y: 0.92, color: "#7A94C4", opacity: 0.55, stop: 0.4 },
];

// Dark glows are the design's CSS ellipses verbatim, in points on a 390pt
// wide frame: `radial-gradient(ellipse rx ry at x y, color, transparent)`.
const DARK_ELLIPSES = [
  { x: 0.12, y: 30, rx: 300, ry: 230, color: "#2D4263", opacity: 0.68 },
  { x: 0.92, y: 170, rx: 280, ry: 190, color: "#4A6390", opacity: 0.3 },
  { x: 0.5, y: 250, rx: 360, ry: 140, color: "#2D4263", opacity: 0.12 },
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
  if (dark) {
    const k = width / 390;
    return (
      <Svg width={width} height={height}>
        <Defs>
          {DARK_ELLIPSES.map((e, i) => (
            <RadialGradient
              key={i}
              id={`darkGlow${i}`}
              cx={e.x * width}
              cy={e.y * k}
              rx={e.rx * k}
              ry={e.ry * k}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={e.color} stopOpacity={e.opacity} />
              <Stop offset="1" stopColor={e.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect width={width} height={height} fill={base[0]} />
        {DARK_ELLIPSES.map((_, i) => (
          <Rect key={i} width={width} height={height} fill={`url(#darkGlow${i})`} />
        ))}
      </Svg>
    );
  }
  const BLOBS = LIGHT_BLOBS;
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
