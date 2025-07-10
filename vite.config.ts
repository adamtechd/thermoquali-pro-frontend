import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const define = {
        // As variáveis VITE_... serão injetadas automaticamente pelo Vite,
        // mas explicitá-las aqui pode ajudar na depuração ou em setups específicos.
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
      root: 'public', // <--- Importante: Indica que o index.html está na pasta 'public'

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
        outDir: '../dist', // O diretório de saída 'dist' ficará na raiz do projeto
      },
    };
});