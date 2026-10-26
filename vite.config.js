import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: { app: 'index.html', planetLab: 'planet-lab.html' },
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          animation: ['gsap'],
        },
      },
    },
  },
});
