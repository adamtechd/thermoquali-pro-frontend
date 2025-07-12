import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Essencial para React

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ''); 

    return {
      plugins: [react()], 
      define: {
        // Apenas para variáveis que você realmente define no .env.local e usa no código
        // Exemplo: 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE')
        // Se não houver outras variáveis em .env.local além da MONGO_URI no backend, este 'define' pode ser removido se não for usado no frontend.
      },
      root: 'public', // <--- Importante: Vite procura index.html aqui
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Alias para a pasta src
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
        outDir: '../dist', // O resultado do build (dist) ficará na raiz do projeto (irmão de public e src)
      },
    };
});