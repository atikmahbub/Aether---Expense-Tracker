import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// iOS uses the Taptic Engine via the impact/selection APIs. On Android those
// drive the raw vibrator, which buzzes on cheap motors; the system haptic
// constants are tuned per device (and respect the user's touch-feedback
// setting), so Android uses them instead. Newer constants (Segment_Tick,
// Confirm, Reject) throw on older API levels — fall back to ones available
// everywhere.
const android = (type: Haptics.AndroidHaptics, fallback: Haptics.AndroidHaptics) => {
  Haptics.performAndroidHapticsAsync(type).catch(() =>
    Haptics.performAndroidHapticsAsync(fallback).catch(() => undefined),
  );
};

const isAndroid = Platform.OS === 'android';

/** Light tick for changing a selection: tabs, segmented controls. */
export const selectionHaptic = () => {
  if (isAndroid) return android(Haptics.AndroidHaptics.Segment_Tick, Haptics.AndroidHaptics.Clock_Tick);
  Haptics.selectionAsync().catch(() => undefined);
};

const safeImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (isAndroid) {
    const heavy =
      style === Haptics.ImpactFeedbackStyle.Medium ||
      style === Haptics.ImpactFeedbackStyle.Heavy ||
      style === Haptics.ImpactFeedbackStyle.Rigid;
    return heavy
      ? android(Haptics.AndroidHaptics.Context_Click, Haptics.AndroidHaptics.Virtual_Key)
      : android(Haptics.AndroidHaptics.Virtual_Key, Haptics.AndroidHaptics.Keyboard_Tap);
  }
  Haptics.impactAsync(style).catch(() => undefined);
};

/** Press feedback; `style` maps to the closest Android system effect. */
export const impactHaptic = safeImpact;

export const withHaptic = (
  action: () => void,
  style = Haptics.ImpactFeedbackStyle.Light,
): void => {
  safeImpact(style);
  action();
};

export const triggerSuccessHaptic = () => {
  if (isAndroid) return android(Haptics.AndroidHaptics.Confirm, Haptics.AndroidHaptics.Context_Click);
  Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => undefined);
};

export const triggerWarningHaptic = () => {
  if (isAndroid) return android(Haptics.AndroidHaptics.Reject, Haptics.AndroidHaptics.Long_Press);
  Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Warning,
  ).catch(() => undefined);
};
