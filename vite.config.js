import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1100, // Set to 1 MB

    sourcemap: true, // Enable source maps for analysis
  },
});

