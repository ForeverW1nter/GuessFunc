import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    exclude: ['node_modules', '__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './__tests__/coverage',
      include: [
        'src/store/**',
        'src/features/**/store.ts',
        'src/components/**',
        'src/features/**/components/**',
        'src/features/ui/components/**',
        'src/utils/mathEngine/**'
      ],
    },
  },
});
