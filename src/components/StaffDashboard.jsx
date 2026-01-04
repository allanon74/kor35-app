import React from 'react';
import { useCharacter } from './CharacterContext';

const StaffDashboard = ({ onLogout }) => {
  const { setStaffWorkMode, isMaster } = useCharacter();

  const menuItems = [
    { id: 'char', label: 'Personaggi e PnG', icon: '👥', color: 'bg-indigo-600' },
    { id: 'plot', label: 'Gestione Plot', icon: '📜', color: 'bg-emerald-600' },
    { id: 'tools', label: 'Strumenti Master', icon: '🛠️', color: 'bg-amber-600', masterOnly: true },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">KOR-35 Staff Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {menuItems.map((item) => {
          if (item.masterOnly && !isMaster) return null;
          
          return (
            <button
              key={item.id}
              onClick={() => setStaffWorkMode(item.id)}
              className={`${item.color} p-8 rounded-xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center justify-center space-y-4`}
            >
              <span className="text-5xl">{item.icon}</span>
              <span className="text-xl font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>

      <button 
        onClick={onLogout}
        className="mt-12 text-gray-400 hover:text-white underline"
      >
        Logout Sessione Staff
      </button>
    </div>
  );
};

export default StaffDashboard;