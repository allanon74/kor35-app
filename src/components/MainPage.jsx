import React, { useState, useEffect } from 'react';
// --- LOGICA PWA: Import necessario per gestire gli aggiornamenti ---
import { useRegisterSW } from 'virtual:pwa-register/react'; 

import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import QrResultModal from './QrResultModal.jsx';
import { useCharacter } from './CharacterContext';
import { 
    Home, 
    QrCode, 
    Zap,        
    TestTube2,  
    Scroll,     
    LogOut, 
    Mail, 
    Backpack,
    Menu,       
    X,          
    UserCog,    
    RefreshCw,  
    Filter,
    DownloadCloud // Nuova icona per l'aggiornamento
} from 'lucide-react';

import AbilitaTab from './AbilitaTab.jsx';
import MessaggiTab from './MessaggiTab.jsx';
import InfusioniTab from './InfusioniTab.jsx'; 
import TessitureTab from './TessitureTab.jsx'; 
import AdminMessageTab from './AdminMessageTab.jsx';
import InventoryTab from './InventoryTab.jsx';

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [qrResultData, setQrResultData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- LOGICA PWA: Hook per gestire il Service Worker ---
  // needRefresh: diventa true se c'è una nuova versione sul server
  // updateServiceWorker: funzione da chiamare per forzare l'aggiornamento
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

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
    unreadCount, 
  } = useCharacter();

  useEffect(() => {
    if (token) fetchPersonaggi();
  }, [token, fetchPersonaggi]);

  const handleScanSuccess = (jsonData) => setQrResultData(jsonData);
  const closeQrModal = () => setQrResultData(null);
  const handleCharacterChange = (e) => selectCharacter(e.target.value);

  const handleMenuNavigation = (tabName) => {
    setActiveTab(tabName);
    setIsMenuOpen(false);
  };

  // --- CALCOLO NOTIFICHE GLOBALI ---
  // Rosso: Messaggi/Admin. Blu: Aggiornamento App disponibile.
  const hasUrgentNotification = unreadCount > 0 || (isAdmin && adminPendingCount > 0);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'abilita': return <AbilitaTab onLogout={onLogout} />;
      case 'infusioni': return <InfusioniTab onLogout={onLogout} />;
      case 'tessiture': return <TessitureTab onLogout={onLogout} />;
      case 'qr': return <QrTab onScanSuccess={handleScanSuccess} onLogout={onLogout} isStealingOnCooldown={isStealingOnCooldown} cooldownTimer={cooldownTimer} />;
      case 'messaggi': return <MessaggiTab onLogout={onLogout} />;
      case 'admin_msg': return <AdminMessageTab onLogout={onLogout} />;
      case 'inventario': return <InventoryTab onLogout={onLogout} />;
      default: return <HomeTab />;
    }
  };

  const renderContextualActions = () => {
    switch(activeTab) {
        case 'home':
            return (
                <button className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors">
                    <RefreshCw size={18} /> Aggiorna Stato
                </button>
            );
        case 'inventario':
            return (
                <button className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors">
                    <Filter size={18} /> Filtra per Peso
                </button>
            );
        default:
            return <p className="text-gray-500 text-sm italic p-2">Nessuna azione rapida disponibile.</p>;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white relative overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center p-3 bg-gray-800 shadow-md shrink-0 border-b border-gray-700 z-10">
          <div className="flex items-center gap-3">
              <img src="/pwa-512x512.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
              <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-400 to-green-400 font-sans italic">
                KOR-35
              </h1>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="relative p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-200"
          >
            <Menu size={28} />
            
            {/* Bollino Rosso: Notifiche Gioco */}
            {hasUrgentNotification && (
                <span className="absolute top-1 right-1 block h-3 w-3 rounded-full ring-2 ring-gray-800 bg-red-500 animate-pulse" />
            )}
            
            {/* Bollino Blu: Aggiornamento App Disponibile (se non c'è quello rosso) */}
            {!hasUrgentNotification && needRefresh && (
                <span className="absolute top-1 right-1 block h-3 w-3 rounded-full ring-2 ring-gray-800 bg-blue-500 animate-bounce" />
            )}
          </button>
      </header>

      {/* --- MENU LATERALE (DRAWER) --- */}
      {isMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-700 flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-xl font-bold text-gray-100">Menu Principale</h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* --- SEZIONE AGGIORNAMENTO APP (Visibile solo se necessario) --- */}
            {needRefresh && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-start gap-3 mb-3">
                        <DownloadCloud className="text-blue-400 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-blue-100 text-sm">Aggiornamento Disponibile</h3>
                            <p className="text-xs text-blue-200 mt-1">Una nuova versione dell'app è disponibile sul server.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => updateServiceWorker(true)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Installa e Ricarica
                    </button>
                </div>
            )}

            {/* SEZIONE 1: PERSONAGGIO */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Personaggio</h3>
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-inner">
                     <select 
                        value={selectedCharacterId} 
                        onChange={(e) => { handleCharacterChange(e); setIsMenuOpen(false); }} 
                        className="w-full px-3 py-2 text-white bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium mb-2" 
                        disabled={isCharacterLoading}
                    >
                        <option value="">-- Seleziona --</option>
                        {personaggiList.map((pg) => (
                        <option key={pg.id} value={pg.id}>
                            {viewAll && isAdmin ? `${pg.nome} (${pg.proprietario_nome || 'Utente'})` : pg.nome}
                        </option>
                        ))}
                    </select>

                    {isAdmin && (
                        <label className="flex items-center space-x-2 cursor-pointer select-none mt-3">
                            <input type="checkbox" checked={viewAll} onChange={toggleViewAll} className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-500 rounded focus:ring-0" />
                            <span className="text-sm text-gray-400">Vedi tutti i PG (Admin)</span>
                        </label>
                    )}
                </div>
            </div>

            {/* SEZIONE 2: NAVIGAZIONE RAPIDA & NOTIFICHE */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Comunicazioni</h3>
                <nav className="space-y-2">
                    <button 
                        onClick={() => handleMenuNavigation('messaggi')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${activeTab === 'messaggi' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Mail size={20} />
                            <span>Messaggi</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {isAdmin && (
                        <button 
                            onClick={() => handleMenuNavigation('admin_msg')}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${activeTab === 'admin_msg' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        >
                            <div className="flex items-center gap-3">
                                <UserCog size={20} />
                                <span>Gestione Admin</span>
                            </div>
                            {adminPendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    {adminPendingCount}
                                </span>
                            )}
                        </button>
                    )}
                </nav>
            </div>

            {/* SEZIONE 3: AZIONI CONTESTUALI */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Azioni Tab Corrente ({activeTab})</h3>
                <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-700">
                    {renderContextualActions()}
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            <button 
                onClick={() => { onLogout(); setIsMenuOpen(false); }} 
                className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
                <LogOut size={20} />
                Disconnetti
            </button>
        </div>

      </div>

      <main className="grow overflow-y-auto bg-gray-900 relative">
        {characterError && <div className="p-4 text-center text-red-400 bg-red-900/20 m-4 rounded-lg border border-red-800">{characterError}</div>}
        {renderTabContent()}
      </main>

      <nav className="grid grid-cols-6 gap-0 p-1 bg-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] shrink-0 border-t border-gray-700 z-10">
        <TabButton icon={<Home size={24} />} label="Scheda" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <TabButton icon={<Backpack size={24} />} label="Zaino" isActive={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} />
        <TabButton icon={<Zap size={28} />} label="Abilità" isActive={activeTab === 'abilita'} onClick={() => setActiveTab('abilita')} />
        <TabButton icon={<Scroll size={28} />} label="Tessiture" isActive={activeTab === 'tessiture'} onClick={() => setActiveTab('tessiture')} />
        <TabButton icon={<TestTube2 size={28} />} label="Infusioni" isActive={activeTab === 'infusioni'} onClick={() => setActiveTab('infusioni')} />
        <TabButton icon={<QrCode size={28} />} label="QR" isActive={activeTab === 'qr'} onClick={() => setActiveTab('qr')} />
      </nav>

      {qrResultData && (
        <QrResultModal data={qrResultData} onClose={closeQrModal} onLogout={onLogout} onStealSuccess={handleStealSuccess} />
      )}
    </div>
  );
};

const TabButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-1 min-w-[45px] transition-all duration-200 ${isActive ? 'text-indigo-400 -translate-y-1' : 'text-gray-500 hover:text-gray-300'} focus:outline-none`}>
    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : ''}`}>{icon}</div>
    <span className={`text-[10px] mt-0.5 font-medium truncate w-full text-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default MainPage;