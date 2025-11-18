import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert' // Rimuovi o commenta questo
import basicSsl from '@vitejs/plugin-basic-ssl' // Aggiungi questo

export default defineConfig(({ command, mode }) => {
  const plugins = [react()];

  // Attiva basicSsl SOLO se stiamo eseguendo il server di sviluppo ('serve')
  if (command === 'serve') {
    plugins.push(basicSsl());
  }

  return {
    plugins: plugins,
    server: {
      host: true,
      // basicSsl abiliterà automaticamente https
    }
  };
});