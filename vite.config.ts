import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // <--- Adicione esta importação

export default defineConfig(({ mode }) => {
    // Carrega variáveis de ambiente do .env para serem acessíveis em process.env
    const env = loadEnv(mode, '.', '');

    return {
      // Adiciona o plugin React para que o Vite compile JSX/TSX
      plugins: [react()], 
      define: {
        // Define variáveis de ambiente para o código do cliente
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Configura um alias '@' para a pasta 'src' do seu projeto
          '@': path.resolve(__dirname, './src'),
        }
      },
      // Configuração do servidor de desenvolvimento local (proxy)
      server: {
        port: 5173, // Porta padrão para o frontend local (Vite)
        proxy: {
          // Qualquer requisição que comece com /api será redirecionada para o backend local
          '/api': { 
            target: 'http://localhost:5000', // URL do seu backend Node.js local
            changeOrigin: true, // Necessário para evitar problemas de CORS em desenvolvimento
            rewrite: (path) => path.replace(/^\/api/, '/api'), // Mantém o prefixo /api na requisição
          },
        },
      },
      // Configurações de build para produção (opcional, pode ser ajustado conforme a Vercel)
      build: {
        // Isso garante que os assets sejam referenciados corretamente
        // Em muitos casos, a Vercel lida bem com isso automaticamente, mas é uma boa prática
        // para garantir que os paths de assets sejam relativos ou corretos.
        // Se você tiver problemas com 404s em assets em produção, essa seção pode precisar de ajustes.
      },
    };
});