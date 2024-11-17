import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.wasm'], // Ensures .wasm files are included in the build
  build: {
    chunkSizeWarningLimit: 1100, // Set to 1 MB

    sourcemap: true, // Enable source maps for analysis
  },
});

