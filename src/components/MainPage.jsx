import React, { useState, useEffect } from 'react';
import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import QrResultModal from './QrResultModal.jsx';
import { useCharacter } from './CharacterContext';
import { 
    Home, 
    QrCode, 
    Zap,        // Abilità
    TestTube2,  // Infusioni
    Scroll,     // Tessiture
    LogOut, 
    Mail 
} from 'lucide-react';

import AbilitaTab from './AbilitaTab.jsx';
import MessaggiTab from './MessaggiTab.jsx';
import InfusioniTab from './InfusioniTab.jsx'; 
import TessitureTab from './TessitureTab.jsx'; 
import AdminMessageTab from './AdminMessageTab.jsx'; // <--- IMPORTANTE: Import mancante

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [qrResultData, setQrResultData] = useState(null);

  // --- GESTIONE COOLDOWN GLOBALE FURTO ---
  const [stealCooldownEnd, setStealCooldownEnd] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  
  const isStealingOnCooldown = Date.now() < stealCooldownEnd;

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

  const handleStealSuccess = () => {
    console.log("Furto riuscito, avvio cooldown 30s");
    setStealCooldownEnd(Date.now() + 30000);
    closeQrModal();
  };

  const {
    personaggiList,
    selectedCharacterId,
    selectCharacter,
    fetchPersonaggi,
    isLoading: isCharacterLoading,
    error: characterError,
    isAdmin,
    viewAll,
    toggleViewAll, 
    adminPendingCount,
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
      case 'abilita':
        return <AbilitaTab onLogout={onLogout} />;
      case 'infusioni': 
        return <InfusioniTab onLogout={onLogout} />;
      case 'tessiture': 
        return <TessitureTab onLogout={onLogout} />;
      case 'qr':
        return (
          <QrTab 
            onScanSuccess={handleScanSuccess} 
            onLogout={onLogout} 
            isStealingOnCooldown={isStealingOnCooldown}
            cooldownTimer={cooldownTimer}
          />
        );
      case 'messaggi': 
        return <MessaggiTab onLogout={onLogout} />;
      case 'admin_msg': // <--- NUOVO CASO
          return <AdminMessageTab onLogout={onLogout} />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-center p-3 bg-gray-800 shadow-md shrink-0 gap-3 z-10 border-b border-gray-700">
        
        {/* Logo e Titolo Stylish */}
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-3">
              {/* Logo Trasparente */}
              <img 
                  src="/pwa-512x512.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain drop-shadow-lg" 
              />
              {/* Titolo Stylish */}
              <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-400 to-green-400 font-sans italic">
                KOR-35
              </h1>
          </div>

          {/* Azioni Header (Mobile): Messaggi + Logout + Admin */}
          <div className="flex items-center gap-3 md:hidden">
            {isAdmin && (
                <div className="relative">
                    {/* CORRETTO: setActiveTab invece di setCurrentTab e chiusa stringa title */}
                    <button 
                        onClick={() => setActiveTab('admin_msg')} 
                        className='bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full flex items-center gap-2 shadow-lg transition-all' 
                        title="Area Admin"
                    >
                        Admin
                    </button>
                    {adminPendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {adminPendingCount}
                        </span>
                    )}
                </div>
            )}
             <button
                onClick={() => setActiveTab('messaggi')}
                className={`relative p-2 rounded-full transition-colors ${activeTab === 'messaggi' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Messaggi"
             >
                <Mail size={22} />
             </button>
             <button
                onClick={onLogout}
                className="text-red-400 hover:text-red-300"
                title="Logout"
             >
                <LogOut size={22} />
             </button>
          </div>
        </div>
        
        {/* Selettore PG e Admin (Desktop e Mobile) */}
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 items-center">
            
          {isAdmin && (
            <label className="flex items-center space-x-2 cursor-pointer select-none bg-gray-700 px-3 py-2 rounded-md border border-gray-600 hover:bg-gray-600 w-full md:w-auto justify-center">
              <input
                type="checkbox"
                checked={viewAll}
                onChange={toggleViewAll}
                className="form-checkbox h-4 w-4 text-indigo-500 transition duration-150 ease-in-out bg-gray-800 border-gray-500 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-300 font-medium whitespace-nowrap">Tutti i PG</span>
            </label>
          )}

          <div className="w-full md:w-64">
            {isCharacterLoading && personaggiList.length === 0 ? (
                <span className="text-sm text-gray-400">Carico personaggi...</span>
            ) : characterError && personaggiList.length === 0 ? (
                <span className="text-sm text-red-400">Errore Caricamento PG</span>
            ) : (
              <select 
                value={selectedCharacterId}
                onChange={handleCharacterChange}
                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium"
                disabled={isCharacterLoading}
              >
                <option value="">-- Seleziona Personaggio --</option>
                {personaggiList.map((pg) => (
                  <option key={pg.id} value={pg.id}>
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

        {/* Azioni Header (Desktop): Messaggi + Logout + Admin */}
        <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
                <div className="relative">
                    <button 
                        onClick={() => setActiveTab('admin_msg')} 
                        className={`px-3 py-1 rounded-full flex items-center gap-2 shadow-lg transition-all font-bold text-sm ${activeTab === 'admin_msg' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`} 
                        title="Area Admin"
                    >
                        Admin
                    </button>
                    {adminPendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {adminPendingCount}
                        </span>
                    )}
                </div>
            )}
            <button
                onClick={() => setActiveTab('messaggi')}
                className={`p-2 rounded-full transition-colors ${activeTab === 'messaggi' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Messaggi"
            >
                <Mail size={24} />
            </button>
            <button
                onClick={onLogout}
                className="flex items-center text-red-400 hover:text-red-300"
                title="Logout"
            >
                <LogOut size={24} />
            </button>
        </div>
      </header>

      {/* Area Contenuto */}
      <main className="grow overflow-y-auto bg-gray-900">
        {characterError && <div className="p-4 text-center text-red-400 bg-red-900/20 m-4 rounded-lg border border-red-800">{characterError}</div>}
        {renderTabContent()}
      </main>

      {/* Navigazione (Bottom Bar) */}
      <nav className="grid grid-cols-5 gap-0 p-1 bg-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] shrink-0 border-t border-gray-700">
        <TabButton
          icon={<Home size={24} />}
          label="Scheda"
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabButton
          icon={<Zap size={28} />}
          label="Abilità"
          isActive={activeTab === 'abilita'}
          onClick={() => setActiveTab('abilita')}
        />
        <TabButton
          icon={<Scroll size={28} />}
          label="Tessiture"
          isActive={activeTab === 'tessiture'}
          onClick={() => setActiveTab('tessiture')}
        />
        <TabButton
          icon={<TestTube2 size={28} />}
          label="Infusioni"
          isActive={activeTab === 'infusioni'}
          onClick={() => setActiveTab('infusioni')}
        />
        <TabButton
          icon={<QrCode size={28} />}
          label="QR"
          isActive={activeTab === 'qr'}
          onClick={() => setActiveTab('qr')}
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
    className={`flex flex-col items-center justify-center p-1 min-w-[45px] transition-all duration-200 ${
      isActive
        ? 'text-indigo-400 -translate-y-1' 
        : 'text-gray-500 hover:text-gray-300'
    } focus:outline-none`}
  >
    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : ''}`}>
        {icon}
    </div>
    <span className={`text-[10px] mt-0.5 font-medium truncate w-full text-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
        {label}
    </span>
  </button>
);

export default MainPage;