import { defineConfig } from 'vitest/config';

// Solo las pruebas del cliente; no necesitan navegador ni la API.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true
  }
});
