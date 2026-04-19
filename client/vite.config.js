import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: "Mera Vyapaar",
        short_name: "व्यापार",
        description: "Electrical wires business management",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1d4ed8",
        orientation: "portrait",
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ],
        screenshots: [
          { src: "/screenshot.svg", sizes: "390x844", type: "image/svg+xml", form_factor: "narrow" }
        ]
      }
    })
  ],
})
