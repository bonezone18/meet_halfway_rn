// babel.config.js
module.exports = function(api) {
  api.cache(true);  // ← ensure the config is cached properly

  return {
    presets: [
      'module:metro-react-native-babel-preset',
    ],
    plugins: [
      [
        // note: still using the "module:" prefix per the plugin’s own docs
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
