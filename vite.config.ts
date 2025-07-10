import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // <--- Essencial para React

export default defineConfig(({ mode }) => {
    // Carrega variáveis de ambiente do .env para serem acessíveis em process.env
    const env = loadEnv(mode, process.cwd(), ''); 

    return {
      plugins: [react()], // <--- Usa o plugin React
      define: {
        // Define variáveis de ambiente, apenas se você tiver algo como GEMINI_API_KEY no .env
        // Se não tiver, pode remover o 'define' ou deixar vazio
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), 
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
        // Nada de especial aqui
      },
    };
});