module.exports = {
  preset: '@react-native/jest-preset',
  // These ship untranspiled ESM, so they have to go through Babel rather than
  // being skipped like the rest of node_modules.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-health)/)',
  ],
};
