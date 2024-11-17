import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    include: ['three', 'three-mesh-bvh'], // Combine the packages into a single array
  },
  assetsInclude: ['**/*.wasm'], // Ensures .wasm files are included in the build
  build: {
    rollupOptions: {
      external: [], // All dependencies will be bundled
      output: {
        format: 'es', // Use ES modules in the output
      },
    },
    chunkSizeWarningLimit: 1100, // Set chunk size warning to 1 MB
    sourcemap: process.env.NODE_ENV === 'development', // Enable source maps in development
  },
});
