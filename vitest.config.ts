import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Solo las pruebas del backend; client/tests tiene su propia configuración.
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup-env.ts'],
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true
  }
});
