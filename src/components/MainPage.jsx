import React, { useState, useEffect } from 'react';
import { Home, QrCode, Square, HelpCircle, LogOut } from 'lucide-react'; // Rimosso X
import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import PlaceholderTab from './PlaceholderTab.jsx';
//import HtmlViewerModal from './HtmlViewerModal.jsx'; // Rimosso
import QrResultModal from './QrResultModal.jsx'; // NUOVO
import { useCharacter } from './CharacterContext';

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  // const [htmlContent, setHtmlContent] = useState(null); // Rimosso
  const [qrResultData, setQrResultData] = useState(null); // NUOVO: Questo conterrà il JSON

  // --- NUOVO: GESTIONE COOLDOWN GLOBALE FURTO ---
  // Salviamo il timestamp in cui il cooldown finisce
  const [stealCooldownEnd, setStealCooldownEnd] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(0); // Per mostrare i secondi
  
  const isStealingOnCooldown = Date.now() < stealCooldownEnd;

  // Effetto per aggiornare il timer visivo
  useEffect(() => {
    if (isStealingOnCooldown) {
      const updateTimer = () => {
        const secondsLeft = Math.ceil((stealCooldownEnd - Date.now()) / 1000);
        setCooldownTimer(secondsLeft > 0 ? secondsLeft : 0);
      };
      updateTimer(); // Esegui subito
      const interval = setInterval(updateTimer, 1000); // Aggiorna ogni secondo
      return () => clearInterval(interval);
    } else {
      setCooldownTimer(0);
    }
  }, [stealCooldownEnd, isStealingOnCooldown]);

  // Funzione da passare alla modale
  const handleStealSuccess = () => {
    console.log("Furto riuscito, avvio cooldown 30s");
    setStealCooldownEnd(Date.now() + 30000); // 30 secondi
    closeQrModal(); // Chiudi la modale
  };

  const {
    personaggiList,
    selectedCharacterId,
    selectCharacter,
    fetchPersonaggi,
    isLoading: isCharacterLoading,
    error: characterError,
  } = useCharacter();

  useEffect(() => {
    if (token) {
      fetchPersonaggi();
    }
  }, [token, fetchPersonaggi]);

  // Modificato: ora riceve JSON, non HTML
  const handleScanSuccess = (jsonData) => {
    setQrResultData(jsonData);
  };

  // Modificato: rinominato per chiarezza
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
        return (<QrTab 
            onScanSuccess={handleScanSuccess} 
            onLogout={onLogout} 
            isStealingOnCooldown={isStealingOnCooldown} // Passa lo stato
            cooldownTimer={cooldownTimer} // Passa il timer
          />
        );
      case 'tab3':
      case 'tab4':
        return <PlaceholderTab tabName={activeTab} />;
      case 'info':
        return <PlaceholderTab tabName="Info" />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white">
      {/* Header (invariato) */}
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
        <div className="w-full md:w-auto">
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
                  {pg.nome}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={onLogout}
          className="hidden md:flex items-center text-red-400 hover:text-red-300"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Area Contenuto (invariata) */}
      <main className="grow overflow-y-auto">
        {characterError && <div className="p-4 text-center text-red-400 bg-red-900">{characterError}</div>}
        {renderTabContent()}
      </main>

      {/* Navigazione (invariata) */}
      <nav className="grid grid-cols-5 gap-1 p-2 bg-gray-800 shadow-lg shrink-0">
        <TabButton
          icon={<Home size={28} />}
          label="Home"
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabButton
          icon={<QrCode size={28} />}
          label="QR Code"
          isActive={activeTab === 'qr'}
          onClick={() => setActiveTab('qr')}
        />
        <TabButton
          icon={<Square size={28} />}
          label="Tab 3"
          isActive={activeTab === 'tab3'}
          onClick={() => setActiveTab('tab3')}
        />
        <TabButton
          icon={<Square size={28} />}
          label="Tab 4"
          isActive={activeTab === 'tab4'}
          onClick={() => setActiveTab('tab4')}
        />
        <TabButton
          icon={<HelpCircle size={28} />}
          label="Info"
          isActive={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
      </nav>

      {/* Modale: Sostituito HtmlViewerModal con QrResultModal */}
      {qrResultData && (
        <QrResultModal
          data={qrResultData}
          onClose={closeQrModal}
          onLogout={onLogout}
          onStealSuccess={handleStealSuccess} // Passa la funzione
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