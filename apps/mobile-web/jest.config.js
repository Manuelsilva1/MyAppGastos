/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  moduleNameMapper: {
    // lucide-react-native publica su build de react-native como ESM; en Jest usamos el build CJS.
    '^lucide-react-native$': require('path').resolve(__dirname, '../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|react-native-css-interop|react-native-svg|@finanzas/shared)',
  ],
};
