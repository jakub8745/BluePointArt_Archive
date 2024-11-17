import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'three-mesh-bvh': path.resolve(__dirname, 'node_modules/three-mesh-bvh')
    }
  },
  assetsInclude: ['**/*.wasm'], // Ensures .wasm files are included in the build
  build: {
    chunkSizeWarningLimit: 1100, // Set to 1 MB
    sourcemap: process.env.NODE_ENV === 'development', // Enable source maps only in development
  },
});
