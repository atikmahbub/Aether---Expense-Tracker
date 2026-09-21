const fs = require('fs');
const { withDangerousMod, withInfoPlist } = require('expo/config-plugins');
const path = require('path');

const MARKER = '// scene-lifecycle-adoption';

/**
 * iOS 26/27 hard-require UIScene lifecycle adoption for apps built with the iOS 27 SDK;
 * without it UIKit traps at launch in _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption.
 * Expo SDK 54 / RN 0.81 don't adopt it yet, so we do it by hand:
 *   - window creation moves out of AppDelegate and into a UIWindowSceneDelegate
 *   - URL and user-activity callbacks are forwarded back to the AppDelegate, so Expo
 *     module subscribers (expo-linking, expo-web-browser / Auth0, expo-dev-client) still fire
 * The SceneDelegate lives in AppDelegate.swift so no new file has to be added to the Xcode project.
 */
const SCENE_DELEGATE = `
${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    let appDelegate = UIApplication.shared.delegate as? AppDelegate

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate?.window = window

    appDelegate?.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil)

    // A cold launch from a deep link delivers the URL here rather than to the AppDelegate.
    if let url = connectionOptions.urlContexts.first?.url {
      _ = appDelegate?.application(UIApplication.shared, open: url, options: [:])
    }
    for activity in connectionOptions.userActivities where activity.activityType == NSUserActivityTypeBrowsingWeb {
      _ = appDelegate?.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    let appDelegate = UIApplication.shared.delegate as? AppDelegate
    _ = appDelegate?.application(UIApplication.shared, open: url, options: [:])
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    let appDelegate = UIApplication.shared.delegate as? AppDelegate
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

const SCENE_CONFIG = `
  ${MARKER}
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }
`;

// AppDelegate no longer owns the window; the scene delegate creates it from the UIWindowScene.
const WINDOW_CREATION = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

function applyToAppDelegate(appDelegatePath) {
  let src = fs.readFileSync(appDelegatePath, 'utf8');
  if (src.includes(MARKER)) return false;

  if (!src.includes(WINDOW_CREATION)) {
    throw new Error(
      'withIosSceneLifecycle: AppDelegate.swift does not match the expected Expo SDK 54 template; ' +
        'review it by hand before re-running.'
    );
  }
  // Drop window creation from didFinishLaunching. UIKit creates the scene first,
  // and startReactNative must run against the scene's window instead.
  src = src.replace(WINDOW_CREATION, '');

  // Hand UIKit our scene delegate.
  const returnSuper =
    '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)\n  }\n';
  if (!src.includes(returnSuper)) {
    throw new Error('withIosSceneLifecycle: could not find didFinishLaunchingWithOptions return');
  }
  src = src.replace(returnSuper, returnSuper + SCENE_CONFIG);

  return fs.writeFileSync(appDelegatePath, src + SCENE_DELEGATE), true;
}

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        // No UISceneDelegateClassName: the class is supplied programmatically from
        // application(_:configurationForConnecting:options:) to avoid Swift name mangling.
      },
    ],
  },
};

module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    return config;
  });

  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegate = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        'AppDelegate.swift'
      );
      applyToAppDelegate(appDelegate);
      return config;
    },
  ]);
};

module.exports.applyToAppDelegate = applyToAppDelegate;
module.exports.SCENE_MANIFEST = SCENE_MANIFEST;
