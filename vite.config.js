import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mkcert() // Aggiungiamo il plugin per i certificati
  ],
  server: {
    https: true, // Abilita HTTPS
    host: true   // Mantiene l'accesso via Network (come il --host)
  }
})
