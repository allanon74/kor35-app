import React, { createContext, useState, useEffect, useRef } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import { CharacterProvider } from './components/CharacterContext';

export default function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlla il token all'avvio
  useEffect(() => {
    const storedToken = localStorage.getItem('kor35_token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Salva il token quando cambia
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('kor35_token', newToken);
    setToken(newToken);
  };

  // Cancella il token e i dati di sessione
  const handleLogout = () => {
    // 1. Rimuove il token
    localStorage.removeItem('kor35_token');
    
    // 2. Rimuove lo stato admin (FONDAMENTALE per la modifica checkbox)
    localStorage.removeItem('kor35_is_staff');
    
    // 3. Rimuove l'ultimo personaggio selezionato (privacy)
    localStorage.removeItem('kor35_last_char_id');
    
    setToken(null);
  };

  // Mostra un caricamento iniziale
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Caricamento in corso...
      </div>
    );
  }

  // Mostra la pagina di login o la pagina principale
  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // AVVOLGIAMO MainPage con CharacterProvider
  return (
    <CharacterProvider onLogout={handleLogout}>
      <MainPage token={token} onLogout={handleLogout} />
    </CharacterProvider>
  );
}