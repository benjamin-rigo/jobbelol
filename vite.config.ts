import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site from /jobbelol/.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/jobbelol/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      input: { main: path.resolve(__dirname, 'index.html'), tervezo: path.resolve(__dirname, 'tervezo.html') },
    },
  },
}))
