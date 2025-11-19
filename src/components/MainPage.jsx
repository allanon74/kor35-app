import React, { useState, useEffect } from 'react';
import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import PlaceholderTab from './PlaceholderTab.jsx';
import QrResultModal from './QrResultModal.jsx';
import { useCharacter } from './CharacterContext';
import { Home, QrCode, Bookmark, HelpCircle, LogOut } from 'lucide-react';
import AbilitaTab from './AbilitaTab.jsx';

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [qrResultData, setQrResultData] = useState(null);

  // --- GESTIONE COOLDOWN GLOBALE FURTO ---
  const [stealCooldownEnd, setStealCooldownEnd] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  
  const isStealingOnCooldown = Date.now() < stealCooldownEnd;

  // Effetto per aggiornare il timer visivo
  useEffect(() => {
    if (isStealingOnCooldown) {
      const updateTimer = () => {
        const secondsLeft = Math.ceil((stealCooldownEnd - Date.now()) / 1000);
        setCooldownTimer(secondsLeft > 0 ? secondsLeft : 0);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownTimer(0);
    }
  }, [stealCooldownEnd, isStealingOnCooldown]);

  // Funzione da passare alla modale
  const handleStealSuccess = () => {
    console.log("Furto riuscito, avvio cooldown 30s");
    setStealCooldownEnd(Date.now() + 30000); // 30 secondi
    closeQrModal();
  };

  const {
    personaggiList,
    selectedCharacterId,
    selectCharacter,
    fetchPersonaggi,
    isLoading: isCharacterLoading,
    error: characterError,
    // Nuovi valori dal Context per la gestione Admin
    isAdmin,
    viewAll,
    toggleViewAll
  } = useCharacter();

  useEffect(() => {
    if (token) {
      fetchPersonaggi();
    }
  }, [token, fetchPersonaggi]);

  const handleScanSuccess = (jsonData) => {
    setQrResultData(jsonData);
  };

  const closeQrModal = () => {
    setQrResultData(null);
  };
  
  const handleCharacterChange = (e) => {
    const newId = e.target.value;
    selectCharacter(newId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'qr':
        return (
          <QrTab 
            onScanSuccess={handleScanSuccess} 
            onLogout={onLogout} 
            isStealingOnCooldown={isStealingOnCooldown}
            cooldownTimer={cooldownTimer}
          />
        );
      case 'abilita':
        return <AbilitaTab onLogout={onLogout} />;
      case 'info':
        return <PlaceholderTab tabName="Info" />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-800 shadow-md shrink-0 gap-4">
        <div className="flex justify-between w-full md:w-auto">
          <h1 className="text-xl font-bold text-indigo-400">KOR-35</h1>
          <button
            onClick={onLogout}
            className="flex items-center text-red-400 hover:text-red-300 md:hidden"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 items-center">
            
          {/* --- CHECKBOX ADMIN (Visibile solo se isAdmin è true) --- */}
          {isAdmin && (
            <label className="flex items-center space-x-2 cursor-pointer select-none bg-gray-700 px-3 py-2 rounded-md border border-gray-600 hover:bg-gray-600">
              <input
                type="checkbox"
                checked={viewAll}
                onChange={toggleViewAll}
                className="form-checkbox h-4 w-4 text-indigo-500 transition duration-150 ease-in-out bg-gray-800 border-gray-500 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-300 font-medium whitespace-nowrap">Tutti i PG</span>
            </label>
          )}
          {/* ------------------------------------------------------- */}

          <div className="w-full md:w-64">
            {isCharacterLoading && personaggiList.length === 0 ? (
                <span className="text-sm text-gray-400">Carico personaggi...</span>
            ) : characterError && personaggiList.length === 0 ? (
                <span className="text-sm text-red-400">Errore Caricamento PG</span>
            ) : (
              <select 
                value={selectedCharacterId}
                onChange={handleCharacterChange}
                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isCharacterLoading}
              >
                <option value="">-- Seleziona Personaggio --</option>
                {personaggiList.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    {/* Mostra il proprietario se si visualizzano tutti i PG */}
                    {viewAll && isAdmin 
                      ? `${pg.nome} (${pg.proprietario_nome || 'Utente'})` 
                      : pg.nome
                    }
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="hidden md:flex items-center text-red-400 hover:text-red-300"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Area Contenuto */}
      <main className="grow overflow-y-auto">
        {characterError && <div className="p-4 text-center text-red-400 bg-red-900">{characterError}</div>}
        {renderTabContent()}
      </main>

      {/* Navigazione */}
      <nav className="grid grid-cols-4 gap-1 p-2 bg-gray-800 shadow-lg shrink-0">
        <TabButton
          icon={<Home size={28} />}
          label="Home"
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabButton
          icon={<Bookmark size={28} />}
          label="Abilità"
          isActive={activeTab === 'abilita'}
          onClick={() => setActiveTab('abilita')}
        />
        <TabButton
          icon={<QrCode size={28} />}
          label="QR Code"
          isActive={activeTab === 'qr'}
          onClick={() => setActiveTab('qr')}
        />
        <TabButton
          icon={<HelpCircle size={28} />}
          label="Info"
          isActive={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
      </nav>

      {/* Modale Risultato QR */}
      {qrResultData && (
        <QrResultModal
          data={qrResultData}
          onClose={closeQrModal}
          onLogout={onLogout}
          onStealSuccess={handleStealSuccess}
        />
      )}
    </div>
  );
};

// Componente bottone tab (helper)
const TabButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

export default MainPage;