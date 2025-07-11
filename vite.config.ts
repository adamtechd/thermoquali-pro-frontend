// thermoquali-pro/vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ''); 

    const define = {
        'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
        'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
        'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
        'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
        'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
        'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    };

    return {
      plugins: [react()], 
      define: define, 
      root: 'public', // <--- PONTO CHAVE: Vite começará a procurar em 'public' para o index.html

      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Alias para a pasta 'src'
        }
      },
      server: {
        port: 5173, 
        proxy: {
          '/api': { 
            target: 'http://localhost:5000', 
            changeOrigin: true, 
            rewrite: (path) => path.replace(/^\/api/, '/api'), 
          },
        },
      },
      build: {
        outDir: '../dist', // <--- PONTO CHAVE: O resultado do build (dist) estará na raiz do projeto (irmão de public e src)
      },
    };
});