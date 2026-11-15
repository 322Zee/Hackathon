import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 4096
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts']
  }
});
