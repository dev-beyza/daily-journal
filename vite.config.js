import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Daily Journal',
        short_name: 'Daily Journal',
        description: 'Zincir kırmama uygulaması',
        theme_color: '#F2F2F7', 
        background_color: '#F2F2F7',
        display: 'standalone', 
        icons: [
          {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='120' fill='%235E5CE6'/%3E%3Cpath fill='%23ffffff' d='M170 106c-35 0-64 29-64 64v172c0 35 29 64 64 64h172c35 0 64-29 64-64V170c0-35-29-64-64-64H170zm32 85a11 11 0 0111-11h106a11 11 0 010 22H213a11 11 0 01-11-11zm0 85a11 11 0 0111-11h106a11 11 0 010 22H213a11 11 0 01-11-11zm0 85a11 11 0 0111-11h64a11 11 0 010 22h-64a11 11 0 01-11-11z'/%3E%3C/svg%3E",
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})