import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./tests/support/setup.ts'],
    css: true,
    server: {
      deps: {
        // @atlaskit/pragmatic-drag-and-drop (an @mui/x-scheduler dependency,
        // STORY-058) ships subpath imports Node's own ESM resolver rejects
        // as unsupported directory imports; Vite's dev/build pipeline
        // (which `vite dev`/`vite build` both use) tolerates this, but
        // Vitest's default Node-native resolution for externalized deps
        // doesn't. Inlining routes it through Vite's own transform instead.
        inline: [/@mui\/x-scheduler/, /@atlaskit\/pragmatic-drag-and-drop/],
      },
    },
  },
});
