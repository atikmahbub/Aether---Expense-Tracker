module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-router/babel", // ✅ REQUIRED for router

      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@trackingPortal": "./src",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],

      "react-native-reanimated/plugin", // ✅ MUST be LAST
    ],
  };
};
