const {
  withAndroidStyles,
  withDangerousMod,
  XML,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * The stock `expo-splash-screen` plugin always wires the Android 12+ system
 * splash to show `@drawable/splashscreen_logo` with `windowSplashScreenBehavior`
 * = `icon_preferred`, i.e. it forces the launcher/splash icon on cold start.
 *
 * On Android that produced an ugly flash: the dark square logo got circular
 * masked on the themed background (a dark icon on the light `#F4F6FA` splash in
 * light mode) BEFORE our JS `ScalarSplashScreen` animation drew the real logo.
 *
 * iOS never shows that — its storyboard just fades into the JS splash. This
 * plugin makes Android behave the same way: keep the system splash a pure solid
 * themed color (transparent icon) so the only thing the user sees is the colored
 * screen, then the JS animation. Re-applied on every prebuild so it can't be
 * wiped by regeneration of the gitignored `android/` folder.
 */

const TRANSPARENT_ICON = 'transparent_splash_icon';

const withTransparentSplashStyles = (config) =>
  withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults;
    const splashStyle = styles.resources.style?.find(
      (s) => s.$.name === 'Theme.App.SplashScreen',
    );
    if (splashStyle) {
      splashStyle.item = splashStyle.item ?? [];
      const setItem = (name, value) => {
        const existing = splashStyle.item.find((i) => i.$.name === name);
        if (existing) {
          existing._ = value;
        } else {
          splashStyle.item.push({ $: { name }, _: value });
        }
      };
      // Blank icon -> system splash is just the solid themed background.
      setItem('windowSplashScreenAnimatedIcon', `@drawable/${TRANSPARENT_ICON}`);
      // Don't force the icon in; let it be a plain colored splash.
      setItem('android:windowSplashScreenBehavior', 'default');
    }
    return cfg;
  });

const withTransparentSplashDrawable = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/drawable',
      );
      await fs.promises.mkdir(resPath, { recursive: true });
      await XML.writeXMLAsync({
        path: path.join(resPath, `${TRANSPARENT_ICON}.xml`),
        xml: {
          shape: {
            $: {
              'xmlns:android': 'http://schemas.android.com/apk/res/android',
              'android:shape': 'rectangle',
            },
            size: [{ $: { 'android:width': '1dp', 'android:height': '1dp' } }],
            solid: [{ $: { 'android:color': '@android:color/transparent' } }],
          },
        },
      });
      return cfg;
    },
  ]);

module.exports = (config) =>
  withTransparentSplashDrawable(withTransparentSplashStyles(config));
