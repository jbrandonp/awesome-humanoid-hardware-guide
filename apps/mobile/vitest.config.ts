import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      'react-native': './__mocks__/react-native.js'
    }
  },
});
