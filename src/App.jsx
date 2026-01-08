import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import StaffDashboard from './components/StaffDashboard'; 
import { CharacterProvider, useCharacter } from './components/CharacterContext';

const AppContent = ({ token, onLogout }) => {
  const { isStaff } = useCharacter();
  
  // Stato per gestire quale interfaccia mostrare (solo per lo staff)
  // 'staff' = Dashboard Master | 'player' = Interfaccia Giocatore
  const [viewMode, setViewMode] = useState('staff'); 

  // Effetto: Se l'utente non è staff, forziamo sempre la vista player
  useEffect(() => {
    if (!isStaff) {
      setViewMode('player');
    }
  }, [isStaff]);

  // Render: Vista Master (Solo se è staff E siamo in modalità staff)
  if (isStaff && viewMode === 'staff') {
    return (
      <StaffDashboard 
        token={token}
        onLogout={onLogout} 
        onSwitchToPlayer={() => setViewMode('player')} 
      />
    );
  }

  // Render: Vista Giocatore (Default per tutti)
  // Passiamo le props per permettere allo staff di tornare indietro
  return (
    <MainPage 
      token={token}
      onLogout={onLogout}
      isStaff={isStaff} 
      onSwitchToMaster={() => setViewMode('staff')}
    />
  );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controllo iniziale del token
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
    localStorage.removeItem('kor35_token');
    localStorage.removeItem('kor35_is_staff');
    localStorage.removeItem('kor35_is_master');
    localStorage.removeItem('kor35_last_char_id');
    setToken(null);
    // Ricarica la pagina per pulire stati residui in memoria
    window.location.reload(); 
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <CharacterProvider onLogout={handleLogout}>
      <AppContent token={token} onLogout={handleLogout} />
    </CharacterProvider>
  );
}