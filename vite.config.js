import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'BuenCuidar',
        short_name: 'BuenCuidar',
        description: 'Plataforma profesional para el cuidado de seres queridos.',
        theme_color: '#0F4C5C',
        icons: [
          {
            src: '/images/rebranding/pwa_icon_square.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/images/rebranding/pwa_icon_square.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/home',
        orientation: 'portrait'
      }
    })
  ],
})
