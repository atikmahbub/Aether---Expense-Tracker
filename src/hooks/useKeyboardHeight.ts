import {useEffect, useState} from 'react';
import {Keyboard, KeyboardEvent, Platform} from 'react-native';

/**
 * Height of the on-screen keyboard, 0 when hidden.
 *
 * Needed on Android because edge-to-edge (Expo SDK 54+) makes
 * SOFT_INPUT_ADJUST_RESIZE a no-op on Android 15+, so the window no longer
 * shrinks when the IME appears and content must be lifted manually.
 */
export default function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) =>
      setHeight(event.endCoordinates?.height ?? 0);
    const onHide = () => setHeight(0);

    const subscriptions = [
      Keyboard.addListener(showEvent, onShow),
      Keyboard.addListener(hideEvent, onHide),
    ];

    return () => subscriptions.forEach(subscription => subscription.remove());
  }, []);

  return height;
}
