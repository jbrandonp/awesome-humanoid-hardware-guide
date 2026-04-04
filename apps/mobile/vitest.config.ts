import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        // This tells Vite not to try and process/transform the react-native package
        // which contains non-standard Flow syntax (import typeof)
        external: ['react-native', 'expo-modules-core']
      }
    }
  },
});
