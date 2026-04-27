import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        // This tells Vite not to try and process/transform the react-native and expo packages
        // which contain non-standard syntax and export fields (import typeof, react-native main)
        external: [
          'react-native',
          'expo',
          'expo-modules-core',
          'expo-background-fetch',
          'expo-task-manager',
          'expo-crypto',
          'expo-secure-store',
          'expo-file-system',
          'expo-battery',
          'expo-camera',
          'expo-local-authentication',
          'expo-barcode-scanner'
        ]
      }
    }
  },
});
