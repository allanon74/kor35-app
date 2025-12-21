import React, { useState, useEffect } from 'react';
// --- LOGICA PWA ---
import { useRegisterSW } from 'virtual:pwa-register/react'; 

import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import QrResultModal from './QrResultModal.jsx';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api'; // Importa fetchAuthenticated

import { 
    Home, QrCode, Zap, TestTube2, Scroll, LogOut, Mail, Backpack, 
    Menu, X, UserCog, RefreshCw, Filter, DownloadCloud, ScrollText, 
    ArrowRightLeft, Gamepad2, Loader2, ExternalLink, Tag, Users,
    Pin, PinOff // AGGIUNTE PER PINNING
} from 'lucide-react';

import AbilitaTab from './AbilitaTab.jsx';
import MessaggiTab from './MessaggiTab.jsx';
import InfusioniTab from './InfusioniTab.jsx'; 
import TessitureTab from './TessitureTab.jsx'; 
import CerimonialiTab from './CerimonialiTab.jsx'; // NUOVO
import AdminMessageTab from './AdminMessageTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import LogViewer from './LogViewer.jsx';
import TransazioniViewer from './TransazioniViewer.jsx';
import GameTab from './GameTab.jsx';

// CONFIGURAZIONE TAB DISPONIBILI (Tutte tranne Home e Game che sono fisse)
const AVAILABLE_TABS = [
    { id: 'inventario', label: 'Zaino', icon: Backpack, component: InventoryTab },
    { id: 'abilita', label: 'Abilità', icon: Zap, component: AbilitaTab },
    { id: 'tessiture', label: 'Tessiture', icon: Scroll, component: TessitureTab },
    { id: 'infusioni', label: 'Infusioni', icon: TestTube2, component: InfusioniTab },
    { id: 'cerimoniali', label: 'Cerimoniali', icon: Users, component: CerimonialiTab }, // NUOVA
    { id: 'qr', label: 'Scanner', icon: QrCode, component: QrTab },
    { id: 'messaggi', label: 'Messaggi', icon: Mail, component: MessaggiTab },
    { id: 'logs', label: 'Diario', icon: ScrollText, component: LogViewer },
    { id: 'transazioni', label: 'Transazioni', icon: ArrowRightLeft, component: TransazioniViewer },
];

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('game'); 
  const [qrResultData, setQrResultData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // STATO PER I PULSANTI RAPIDI (SHORTCUTS)
  const [userShortcuts, setUserShortcuts] = useState(['inventario', 'messaggi', 'qr']);

  // --- LOGICA PWA ---
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
    selectedCharacterId,
    selectedCharacterData, 
    selectCharacter,
    fetchPersonaggi,
    isLoading,
    isAdmin,
    adminPendingCount,
    unreadCount, 
  } = useCharacter();

  // CARICAMENTO SHORTCUTS DAL DB
  useEffect(() => {
    if (token) fetchPersonaggi();
  }, [token, fetchPersonaggi]);

  useEffect(() => {
      if (selectedCharacterData?.impostazioni_ui?.shortcuts) {
          setUserShortcuts(selectedCharacterData.impostazioni_ui.shortcuts);
      }
  }, [selectedCharacterData]);

  // FUNZIONE PER SALVARE SHORTCUTS
  const toggleShortcut = async (tabId) => {
      if (!selectedCharacterId) return;

      let newShortcuts;
      if (userShortcuts.includes(tabId)) {
          newShortcuts = userShortcuts.filter(id => id !== tabId);
      } else {
          if (userShortcuts.length >= 4) {
              alert("Puoi fissare al massimo 4 schede nella barra inferiore.");
              return;
          }
          newShortcuts = [...userShortcuts, tabId];
      }

      // Aggiornamento ottimistico
      setUserShortcuts(newShortcuts);

      // Chiamata API per salvare (PATCH su Personaggio)
      try {
          await fetchAuthenticated(`/personaggi/api/personaggi/${selectedCharacterId}/`, onLogout, {
              method: 'PATCH',
              body: JSON.stringify({
                  impostazioni_ui: { 
                      ...selectedCharacterData.impostazioni_ui,
                      shortcuts: newShortcuts 
                  }
              })
          });
      } catch (error) {
          console.error("Errore salvataggio shortcuts", error);
      }
  };

  const handleScanSuccess = (jsonData) => setQrResultData(jsonData);
  const closeQrModal = () => setQrResultData(null);
  
  const handleMenuNavigation = (tabName) => {
    setActiveTab(tabName);
    setIsMenuOpen(false);
  };

  // --- CALCOLO NOTIFICHE ---
  const hasAdminNotif = isAdmin && adminPendingCount > 0;
  const hasMsgNotif = unreadCount > 0;
  const hasJobNotif = selectedCharacterData?.lavori_pendenti_count > 0;
  
  const renderTabContent = () => {
    if (activeTab === 'home') return <HomeTab />;
    if (activeTab === 'game') return <GameTab onNavigate={handleMenuNavigation} />;
    
    // Admin tab speciale
    if (activeTab === 'admin_msg') return <AdminMessageTab onLogout={onLogout} />;

    // Cerca nei tab disponibili
    const tabDef = AVAILABLE_TABS.find(t => t.id === activeTab);
    if (tabDef) {
        const Component = tabDef.component;
        // Passa props specifiche se necessario
        if (tabDef.id === 'qr') return <QrTab onScanSuccess={handleScanSuccess} onLogout={onLogout} isStealingOnCooldown={isStealingOnCooldown} cooldownTimer={cooldownTimer} />;
        if (tabDef.id === 'logs' || tabDef.id === 'transazioni') return <div className="p-4 h-full overflow-y-auto"><Component charId={selectedCharacterId} /></div>;
        return <Component onLogout={onLogout} />;
    }
    
    return <HomeTab />;
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white relative overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="relative flex justify-between items-center p-3 bg-gray-800 shadow-md shrink-0 border-b border-gray-700 z-10 h-16">
          
          <div className="flex items-center gap-3 z-20">
              <img src="/pwa-512x512.png" alt="Logo" className="w-9 h-9 object-contain drop-shadow-lg" />
              <h1 className="text-xl font-black italic hidden sm:block text-blue-400">KOR-35</h1>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-10">
            {selectedCharacterData ? (
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 uppercase tracking-widest leading-none mb-0.5">Operativo</span>
                    <span className="font-bold text-white text-base tracking-wide drop-shadow-md">{selectedCharacterData.nome}</span>
                </div>
            ) : <span className="text-gray-500 italic text-sm">Seleziona Personaggio</span>}
          </div>

          <div className="flex items-center gap-3 z-20">
              {isLoading && <Loader2 size={20} className="text-indigo-400 animate-spin" />}
              <button onClick={() => setIsMenuOpen(true)} className="relative p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-200">
                <Menu size={28} />
                {hasAdminNotif && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-gray-800 bg-red-600 animate-pulse" />}
                {hasMsgNotif && <span className="absolute top-0 left-0 block h-3 w-3 rounded-full ring-2 ring-gray-800 bg-purple-500" />}
                {needRefresh && <span className="absolute bottom-0 left-0 block h-3 w-3 rounded-full ring-2 ring-gray-800 bg-blue-500 animate-pulse" />}
              </button>
          </div>
      </header>

      {/* --- DRAWER MENU (NAVIGAZIONE COMPLETA) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
            <div className="relative w-80 bg-gray-800 h-full shadow-2xl flex flex-col border-l border-gray-700 animate-slide-in-right">
                
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wider">Navigazione</h2>
                    <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* INFO UTENTE */}
                    <div className="p-3 bg-gray-800/50 border border-gray-700 rounded mb-4">
                        <p className="text-xs text-gray-400">Tocca <Pin size={12} className="inline mx-1"/> per aggiungere alla barra in basso.</p>
                    </div>

                    {/* LISTA TAB */}
                    {AVAILABLE_TABS.map(tab => {
                        const isPinned = userShortcuts.includes(tab.id);
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        
                        return (
                            <div key={tab.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-900/30 border border-indigo-500/30' : 'hover:bg-gray-700 border border-transparent'}`}>
                                <button 
                                    className="flex items-center gap-3 flex-1 text-left"
                                    onClick={() => handleMenuNavigation(tab.id)}
                                >
                                    <Icon size={20} className={isActive ? "text-indigo-400" : "text-gray-400"} />
                                    <span className={isActive ? "text-indigo-100 font-bold" : "text-gray-300"}>{tab.label}</span>
                                </button>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleShortcut(tab.id);
                                    }}
                                    className={`p-2 rounded-full transition-colors ${isPinned ? 'text-amber-400 hover:bg-amber-400/10' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    {isPinned ? <Pin size={18} fill="currentColor" /> : <PinOff size={18} />}
                                </button>
                            </div>
                        );
                    })}

                    {/* ADMIN BUTTON */}
                    {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <button onClick={() => handleMenuNavigation('admin_msg')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-900/20 text-red-300 hover:bg-red-900/30">
                                <Mail size={20} /> <span>Admin Messaggi</span>
                                {adminPendingCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{adminPendingCount}</span>}
                            </button>
                        </div>
                    )}
                    
                    {/* UPDATE PWA */}
                    {needRefresh && (
                        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm"><DownloadCloud size={16}/> Aggiornamento disponibile</div>
                            <button onClick={() => updateServiceWorker(true)} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold">Aggiorna Ora</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto relative bg-gray-900 scrollbar-hide">
        {renderTabContent()}
      </main>

      {/* --- BOTTOM NAV (DINAMICA) --- */}
      <nav className="flex justify-around items-center bg-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] shrink-0 border-t border-gray-700 z-10 h-[60px] pb-safe">
        {/* Tasti Fissi */}
        <TabButton icon={<Gamepad2 size={24} />} label="Game" isActive={activeTab === 'game'} onClick={() => setActiveTab('game')} />
        <TabButton icon={<Home size={24} />} label="Scheda" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        
        <div className="w-px h-8 bg-gray-700 mx-1"></div>

        {/* Tasti Dinamici */}
        {userShortcuts.map(tabId => {
            const tab = AVAILABLE_TABS.find(t => t.id === tabId);
            if (!tab) return null;
            const Icon = tab.icon;
            return (
                <TabButton 
                    key={tabId}
                    icon={<Icon size={24} />} 
                    label={tab.label} 
                    isActive={activeTab === tabId} 
                    onClick={() => setActiveTab(tabId)} 
                />
            );
        })}
      </nav>

      {qrResultData && (
        <QrResultModal data={qrResultData} onClose={closeQrModal} onLogout={onLogout} onStealSuccess={handleStealSuccess} />
      )}
    </div>
  );
};

const TabButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-1 min-w-14 h-full transition-all duration-200 ${isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'} focus:outline-none`}>
    <div className={`transition-transform ${isActive ? '-translate-y-0.5 scale-110' : ''}`}>{icon}</div>
    <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>{label}</span>
  </button>
);

export default MainPage;