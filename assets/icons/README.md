Scalar app icons (mark 2e, Lens)

Copy this folder to ./assets/icons in your Expo project.

app.json
{
  "expo": {
    "icon": "./assets/icons/icon.png",
    "ios": {
      "icon": {
        "light": "./assets/icons/ios/icon-light.png",
        "dark": "./assets/icons/ios/icon-dark.png",
        "tinted": "./assets/icons/ios/icon-tinted.png"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/android/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/icons/android/adaptive-icon-background.png",
        "backgroundColor": "#0A0F1C",
        "monochromeImage": "./assets/icons/android/monochrome-icon.png"
      }
    },
    "web": { "favicon": "./assets/icons/web/favicon.png" },
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/icons/splash/splash-icon-light.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#F4F6F9",
        "dark": {
          "image": "./assets/icons/splash/splash-icon-dark.png",
          "backgroundColor": "#04050A"
        }
      }],
      ["expo-notifications", {
        "icon": "./assets/icons/android/notification-icon.png",
        "color": "#C84B31"
      }]
    ]
  }
}

Files
- icon.png: 1024, opaque, default for both platforms
- ios/icon-light|dark|tinted.png: iOS 18 appearance variants (dark is transparent, tinted is greyscale on black)
- android/adaptive-icon-foreground.png: mark inside the 66% safe zone, transparent
- android/adaptive-icon-background.png: dark gradient
- android/monochrome-icon.png: Android 13 themed icon (white on transparent)
- android/notification-icon.png: 96px, white on transparent
- splash/*: transparent marks for light and dark splash
- web/favicon.png: 48px
- store/play-store-512.png: Google Play listing icon
- src/*.svg: vector sources
