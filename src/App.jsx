import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';

export default function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlla il token all'avvio
  useEffect(() => {
    const storedToken = localStorage.getItem('kor35_token');
    if (storedToken) {
      // Qui potresti aggiungere una logica per *validare* il token con il server
      // Per ora, ci fidiamo che esista
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Salva il token quando cambia
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('kor35_token', newToken);
    setToken(newToken);
  };

  // Cancella il token
  const handleLogout = () => {
    localStorage.removeItem('kor35_token');
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

  return <MainPage onLogout={handleLogout} />;
}

