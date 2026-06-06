import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['controllers/**/*.js', 'services/**/*.js', 'middleware/**/*.js', 'models/**/*.js'],
      exclude: ['node_modules/**', 'tests/**', '__tests__/**']
    }
  }
});
