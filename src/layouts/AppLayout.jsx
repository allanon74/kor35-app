import React, { useState, useEffect } from 'react';
import { useCharacter } from '../components/CharacterContext';
import StaffDashboard from '../components/StaffDashboard';
import MainPage from '../components/MainPage';

const AppLayout = ({ token, onLogout }) => {
  const { isStaff } = useCharacter();
  
  // Stato per gestire quale interfaccia mostrare (solo per lo staff)
  // 'staff' = Dashboard Master | 'player' = Interfaccia Giocatore
  const [viewMode, setViewMode] = useState('staff'); 

  // Memorizza quale tool aprire nella dashboard (default 'home')
  const [dashboardInitialTool, setDashboardInitialTool] = useState('home');

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
        onSwitchToPlayer={() => {
            setViewMode('player');
            setDashboardInitialTool('home'); 
        }}
        initialTool={dashboardInitialTool}
      />
    );
  }

  // Render: Vista Giocatore (Default per tutti)
  return (
    <MainPage 
      token={token}
      onLogout={onLogout}
      isStaff={isStaff} 
      onSwitchToMaster={(tool = 'home') => {
          setDashboardInitialTool(tool);
          setViewMode('staff');
      }}
    />
  );
};

export default AppLayout;