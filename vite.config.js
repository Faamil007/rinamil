import { defineConfig } from 'vite'; // Add this import
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});