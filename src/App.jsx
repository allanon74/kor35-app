import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import StaffDashboard from './components/StaffDashboard';
import { fetchAuthenticated } from './api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isStaff, setIsStaff] = useState(localStorage.getItem('is_staff') === 'true');
  const [isMasterView, setIsMasterView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // NUOVO STATO: Memorizza quale tool aprire nella dashboard (default 'home')
  const [dashboardInitialTool, setDashboardInitialTool] = useState('home');

  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verifica se il token è valido facendo una chiamata leggera
          // Nota: potresti voler creare un endpoint dedicato /verify-token/ 
          // Qui usiamo una chiamata generica o assumiamo valido se presente, 
          // ma l'ideale è verificare. Per ora ci fidiamo del localStorage 
          // e gestiamo il 401 nelle chiamate API.
          setToken(storedToken);
        } catch (error) {
          console.error("Token non valido", error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const handleLogin = (newToken, staffStatus) => {
    setToken(newToken);
    setIsStaff(staffStatus);
    localStorage.setItem('token', newToken);
    localStorage.setItem('is_staff', staffStatus);
  };

  const handleLogout = () => {
    setToken(null);
    setIsStaff(false);
    setIsMasterView(false);
    setDashboardInitialTool('home'); // Reset
    localStorage.removeItem('token');
    localStorage.removeItem('is_staff');
    localStorage.removeItem('selectedCharacterId'); // Pulizia extra
  };

  // MODIFICATO: Accetta un parametro opzionale 'tool'
  const handleSwitchToMaster = (tool = 'home') => {
    setDashboardInitialTool(tool);
    setIsMasterView(true);
  };

  const handleSwitchToPlayer = () => {
    setIsMasterView(false);
    setDashboardInitialTool('home'); // Reset opzionale quando si torna al player
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Caricamento...</div>;
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Se è staff E ha attivato la vista master
  if (isStaff && isMasterView) {
    return (
      <StaffDashboard 
        onLogout={handleLogout} 
        onSwitchToPlayer={handleSwitchToPlayer}
        initialTool={dashboardInitialTool} // <--- PASSAGGIO DELLA PROP
      />
    );
  }

  // Vista Giocatore (Default)
  return (
    <MainPage 
      token={token} 
      onLogout={handleLogout}
      isStaff={isStaff}
      onSwitchToMaster={handleSwitchToMaster} // <--- Passiamo la funzione aggiornata
    />
  );
}

export default App;