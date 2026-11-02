import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false } },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) return 'three-scene';
          if (id.includes('node_modules/chart.js/')) return 'charts';
        },
      },
    },
  },
  test: { include: ['src/**/*.test.ts'] },
});
