import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Heavy libraries load on demand instead of inflating the first page.
        advancedChunks: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/ },
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'maps', test: /node_modules[\\/](leaflet|react-leaflet)[\\/]/ },
          ],
        },
      },
    },
  },
})
