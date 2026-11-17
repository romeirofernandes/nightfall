import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {resolve} from 'node:path';
export default defineConfig({
 plugins:[react(),tailwindcss()],
 build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{
  gallery:resolve(import.meta.dirname,'index.html'),
  afterHours:resolve(import.meta.dirname,'after-hours/index.html'),
  help:resolve(import.meta.dirname,'mac-help/index.html')
 }}}
});
