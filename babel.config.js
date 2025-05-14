// babel.config.js
module.exports = function(api) {
  api.cache(true);

  return {
    presets: [
      'module:metro-react-native-babel-preset',
    ],
    plugins: [
      // A) Strip all Flow types (including `import type …`)
      '@babel/plugin-transform-flow-strip-types',

      // B) Strip all TS types & `as`-casts from .js (via allExtensions)
      ['@babel/plugin-transform-typescript', { allExtensions: true, isTSX: false }],

      // C) Your dotenv plugin last
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      }],
    ],
  };
};
