import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // Carrega as variáveis de ambiente (Gemini Key, etc)
    const env = loadEnv(mode, '.', '');

    return {
        server: {
            port: 3000,
            host: '0.0.0.0', // Permite acesso pelo celular na rede local
        },
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                // O iPhone procura especificamente por estes nomes na pasta public:
                includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
                manifest: {
                    name: 'DuoFinance - Gestão para Casal',
                    short_name: 'DuoFinance', // Nome que aparece embaixo do ícone no celular
                    description: 'Gestão Financeira Inteligente para Casais',
                    theme_color: '#09090b',
                    background_color: '#09090b',
                    display: 'standalone', // Remove a barra de navegação do browser
                    orientation: 'portrait',
                    start_url: '/',
                    scope: '/',
                    icons: [
                        {
                            src: '/pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable' // Importante para Android não cortar o ícone
                        }
                    ]
                }
            })
        ],
        define: {
            // Mantém suas configurações do Gemini intactas
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});