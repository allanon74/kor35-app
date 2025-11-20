import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
  const plugins = [
    react(),
    // Configurazione PWA
    VitePWA({
      registerType: 'autoUpdate', // Aggiorna l'app appena c'è una nuova versione
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // Permette di testare la PWA in modalità dev (npm run dev)
      devOptions: {
        enabled: true
      },

      manifest: {
        name: 'KOR-35 Gestione personaggi', // Cambia questo
        short_name: 'KOR-35 PG',   // Cambia questo (max 12 caratteri circa)
        description: 'Web app per il gioco di ruolo dal vivo (LARP) KOR-35 per la gestione dei propri personaggi',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // FONDAMENTALE: Nasconde la barra del browser
        orientation: 'portrait', // Opzionale: blocca in verticale
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png', // Assicurati che questi file esistano in /public
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
            purpose: 'any maskable' // Importante per Android
          }
        ],
        screenshots: [
          // Aggiunta avviso 'wide':
          {
            src: 'screenshots/desktop-home.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide'
          },
          // Aggiunta avviso mobile:
          {
            src: 'screenshots/mobile-home.png',
            sizes: '750x1334',
            type: 'image/png'
          }
        ]

      }
    })
  ];

  // Attiva basicSsl SOLO se stiamo eseguendo il server di sviluppo ('serve')
  // Questo è utile per testare la PWA in locale, dato che i Service Worker richiedono HTTPS
  if (command === 'serve') {
    plugins.push(basicSsl());
  }

  return {
    plugins: plugins,
    server: {
      host: true,
      // basicSsl abiliterà automaticamente https, ma per sicurezza lo esplicitiamo se il plugin è attivo
      https: command === 'serve', 
    }
  };
});