import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        petMeadow: resolve(__dirname, 'pet-meadow.html'),
        stickyNote: resolve(__dirname, 'sticky-note.html'),
      },
    },
  },
})