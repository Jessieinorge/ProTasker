module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    transform: {
      // Transform JavaScript and TypeScript files with babel-jest
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
      // Ignore transforming modules from node_modules, except for react-native,
      'node_modules/(?!(react-native|@react-native|firebase|react-native-dropdown-picker)/)',
      'node_modules/(?!(react-native|@react-native|firebase)/)',
      'node_modules/(?!react-native-calendars)/',
    ],
    moduleNameMapper: {
      //  mock these imports in tests to avoid errors
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
      // Mock CSS modules or stylesheets 
      '\\.(css|less)$': 'identity-obj-proxy',
    },
    setupFiles: [
      // Path to any setup file to configure the environment variables, global mocks, etc.
      // Example: '<rootDir>/jest.setup.js',
      // './node_modules/react-native-gesture-handler/jestSetup.js'
    ],
    globals: {
    },
    testPathIgnorePatterns: [
      // Ignore specific directories or files from being tested
      '<rootDir>/node_modules/',
      '<rootDir>/android/',
      '<rootDir>/ios/',
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/',
    ],
  };
  