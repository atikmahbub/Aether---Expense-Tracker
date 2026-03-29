import * as Haptics from 'expo-haptics';

const safeImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  Haptics.impactAsync(style).catch(() => undefined);
};

export const withHaptic = (
  action: () => void,
  style = Haptics.ImpactFeedbackStyle.Light,
): void => {
  safeImpact(style);
  action();
};

export const triggerSuccessHaptic = () => {
  Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => undefined);
};

export const triggerWarningHaptic = () => {
  Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Warning,
  ).catch(() => undefined);
};
