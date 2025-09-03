import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for CaseBuddy React application
// See https://vitejs.dev/config/ for details.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});