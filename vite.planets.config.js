import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',build:{copyPublicDir:false,outDir:'planet-lab-dist',rollupOptions:{input:'planet-lab.html'}}});
