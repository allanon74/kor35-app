import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import PlotTab from './components/PlotTab';
import StaffDashboard from './components/StaffDashboard'; 
import { CharacterProvider, useCharacter } from './components/CharacterContext';

// Sottocomponente per gestire il "bivio" di navigazione
const AppContent = ({ token, handleLogout }) => {
  const { isStaff, staffWorkMode } = useCharacter();

  // Se l'utente NON è staff, va direttamente alla MainPage
  if (!isStaff) {
    return <MainPage token={token} onLogout={handleLogout} />;
  }

  // Se è staff, mostriamo la sezione basata sulla scelta nella Dashboard
  switch (staffWorkMode) {
    case 'char':
      return <MainPage token={token} onLogout={handleLogout} />;
    case 'plot':
      return <PlotTab onLogout={handleLogout} />;
    case 'tools':
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Strumenti Master</h2>
          <p>Sezione in fase di sviluppo...</p>
        </div>
      );
    default:
      // Per impostazione predefinita, lo staff atterra sulla Dashboard
      return <StaffDashboard onLogout={handleLogout} />;
  }
};

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

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('kor35_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    // Pulizia totale della sessione
    localStorage.removeItem('kor35_token');
    localStorage.removeItem('kor35_is_staff');
    localStorage.removeItem('kor35_is_master');
    localStorage.removeItem('kor35_last_char_id');
    setToken(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Caricamento in corso...
      </div>
    );
  }

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <CharacterProvider onLogout={handleLogout}>
      <AppContent token={token} handleLogout={handleLogout} />
    </CharacterProvider>
  );
}