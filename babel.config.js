module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // Configuration specific to the test environment
      test: {
        presets: [
          [
            'babel-preset-expo',
          ],
        ],
        plugins: [
          // Plugins needed for Jest or to mock ES Modules imports
          'react-native-reanimated/plugin',
        ],
      },
    },
    // Add any plugins that are required for your application outside of testing
    plugins: [],
  };
};
