module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel", // <--- In v2, this is a PLUGIN.
      "react-native-reanimated/plugin",
    ],
  };
};