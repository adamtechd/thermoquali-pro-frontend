import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ''); 

    return {
      plugins: [react()], 
      define: {
        // Nenhuma variável de ambiente específica para Firebase aqui, já que não estamos usando.
        // Se houver chaves de API específicas para o frontend em .env.local, defina-as aqui.
      },
      root: 'public', // <--- Importante: Vite procura index.html aqui
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), 
        }
      },
      server: {
        port: 5173, 
        proxy: {
          '/api': { 
            target: 'http://localhost:5000', // URL do seu backend Node.js local
            changeOrigin: true, 
            rewrite: (path) => path.replace(/^\/api/, '/api'), 
          },
        },
      },
      build: {
        outDir: '../dist', // O resultado do build (dist) ficará na raiz do projeto
      },
    };
});