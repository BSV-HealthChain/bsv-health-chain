import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(),
    nodePolyfills({
      // Add specific polyfills if needed
      globals: {
        process: true,
        global: true,
      },
    }),

  ],
  build: { outDir: "build" }
});
