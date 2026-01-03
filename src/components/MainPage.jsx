import React, { useState, useEffect } from 'react';
// --- LOGICA PWA ---
import { useRegisterSW } from 'virtual:pwa-register/react'; 

import HomeTab from './HomeTab.jsx';
import QrTab from './QrTab.jsx';
import QrResultModal from './QrResultModal.jsx';
import { useCharacter } from './CharacterContext';
import { TimerOverlay } from './TimerOverlay';
import { fetchAuthenticated } from '../api'; 

import { 
    Home, QrCode, Zap, TestTube2, Scroll, LogOut, Mail, Backpack, 
    Menu, X, UserCog, RefreshCw, Filter, DownloadCloud, ScrollText, 
    ArrowRightLeft, Gamepad2, Loader2, ExternalLink, Tag, Users,
    Pin, PinOff, Briefcase
} from 'lucide-react';

import AbilitaTab from './AbilitaTab.jsx';
import MessaggiTab from './MessaggiTab.jsx';
import InfusioniTab from './InfusioniTab.jsx'; 
import TessitureTab from './TessitureTab.jsx'; 
import CerimonialiTab from './CerimonialiTab.jsx'; 
import AdminMessageTab from './AdminMessageTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import LogViewer from './LogViewer.jsx';
import TransazioniViewer from './TransazioniViewer.jsx';
import GameTab from './GameTab.jsx';
import JobRequestsWidget from './JobRequestsWidget.jsx'; // Se lo usi come tab o widget

// VERSIONE APP
const APP_VERSION = "0.2.1"; 

// CONFIGURAZIONE TAB DISPONIBILI
const AVAILABLE_TABS = [
    { id: 'inventario', label: 'Zaino', icon: Backpack, component: InventoryTab },
    { id: 'abilita', label: 'Abilità', icon: Zap, component: AbilitaTab },
    { id: 'tessiture', label: 'Tessiture', icon: Scroll, component: TessitureTab },
    { id: 'infusioni', label: 'Infusioni', icon: TestTube2, component: InfusioniTab },
    { id: 'cerimoniali', label: 'Cerimoniali', icon: Users, component: CerimonialiTab },
    { id: 'qr', label: 'Scanner', icon: QrCode, component: QrTab },
    { id: 'messaggi', label: 'Messaggi', icon: Mail, component: MessaggiTab },
    { id: 'logs', label: 'Diario', icon: ScrollText, component: LogViewer },
    { id: 'transazioni', label: 'Transazioni', icon: ArrowRightLeft, component: TransazioniViewer },
    // Aggiungi job requests se è una tab separata, altrimenti è gestita diversamente
];

const MainPage = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('game'); 
  const [qrResultData, setQrResultData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // STATO SHORTCUTS (Default salvagente)
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

  // --- COOLDOWN FURTO ---
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

  // --- CONTEXT ---
  const {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,
    activeTimers,      // <--- Aggiunto
    removeTimerState,  // <--- Aggiunto 
    selectCharacter,
    fetchPersonaggi,
    isLoading,
    isAdmin,
    viewAll,
    toggleViewAll,
    adminPendingCount,
    unreadCount, 
  } = useCharacter();

  // CARICAMENTO INIZIALE
  useEffect(() => {
    if (token) fetchPersonaggi();
  }, [token, fetchPersonaggi]);

  // CARICAMENTO PREFERENZE UI DAL DB
  useEffect(() => {
      if (selectedCharacterData?.impostazioni_ui?.shortcuts) {
          setUserShortcuts(selectedCharacterData.impostazioni_ui.shortcuts);
      }
  }, [selectedCharacterData]);

  // SALVATAGGIO PREFERENZE
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

      setUserShortcuts(newShortcuts);

      try {
          // CORREZIONE APPLICATA QUI: header Content-Type aggiunto
          await fetchAuthenticated(`/personaggi/api/personaggi/${selectedCharacterId}/`, onLogout, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  impostazioni_ui: { 
                      ...(selectedCharacterData.impostazioni_ui || {}),
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

  // --- NOTIFICHE ---
  // Calcolo flag per i pallini colorati
  const hasAdminNotif = isAdmin && adminPendingCount > 0;
  const hasMsgNotif = unreadCount > 0;
  // Assumiamo che i lavori pendenti siano nel count del personaggio (adatta il campo se diverso)
  const jobsCount = selectedCharacterData?.lavori_pendenti_count || 0; 
  const hasJobNotif = jobsCount > 0; 

  const renderTabContent = () => {
    if (activeTab === 'home') return <HomeTab />;
    if (activeTab === 'game') return <GameTab onNavigate={handleMenuNavigation} />;
    if (activeTab === 'admin_msg') return <AdminMessageTab onLogout={onLogout} />;

    const tabDef = AVAILABLE_TABS.find(t => t.id === activeTab);
    if (tabDef) {
        const Component = tabDef.component;
        // Props speciali
        if (tabDef.id === 'qr') return <QrTab onScanSuccess={handleScanSuccess} onLogout={onLogout} isStealingOnCooldown={isStealingOnCooldown} cooldownTimer={cooldownTimer} />;
        if (tabDef.id === 'logs' || tabDef.id === 'transazioni') return <div className="p-4 h-full overflow-y-auto"><Component charId={selectedCharacterId} /></div>;
        
        return <Component onLogout={onLogout} />;
    }
    return <HomeTab />;
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-900 text-white relative overflow-hidden">
        {/* --- TIMER OVERLAY --- */}
      {/* Lo mettiamo qui per garantire che sia sopra il contenuto ma sotto i menu/header se necessario */}
      <TimerOverlay activeTimers={activeTimers} onRemove={removeTimerState} />
      
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
                
                {/* PALLINI NOTIFICHE HEADER */}
                <div className="absolute top-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                    {hasAdminNotif && <span className="block h-2.5 w-2.5 rounded-full ring-1 ring-gray-900 bg-red-600 animate-pulse shadow-sm" title="Admin Pending" />}
                    {hasMsgNotif && <span className="block h-2.5 w-2.5 rounded-full ring-1 ring-gray-900 bg-purple-500 shadow-sm" title="Messaggi" />}
                    {hasJobNotif && <span className="block h-2.5 w-2.5 rounded-full ring-1 ring-gray-900 bg-amber-500 shadow-sm" title="Lavori" />}
                    {needRefresh && <span className="block h-2.5 w-2.5 rounded-full ring-1 ring-gray-900 bg-blue-500 animate-bounce shadow-sm" title="Update" />}
                </div>
              </button>
          </div>
      </header>

      {/* --- DRAWER MENU --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
            
            <div className="relative w-85 max-w-sm bg-gray-800 h-full shadow-2xl flex flex-col border-l border-gray-700 animate-slide-in-right overflow-hidden">
                
                {/* DRAWER HEADER */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 shrink-0">
                    <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
                        <UserCog size={20} className="text-indigo-400"/> Opzioni
                    </h2>
                    <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                {/* DRAWER CONTENT SCROLLABLE */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    
                    {/* 1. SELETTORE PERSONAGGIO */}
                    <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cambia Personaggio</label>
                        <select 
                            className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none text-sm"
                            value={selectedCharacterId}
                            onChange={(e) => {
                                selectCharacter(e.target.value);
                                setIsMenuOpen(false); // Chiude menu dopo cambio
                            }}
                        >
                            {personaggiList.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nome} {p.is_main ? '(Main)' : ''}
                                </option>
                            ))}
                        </select>

                        {/* 2. ADMIN VIEW ALL TOGGLE */}
                        {isAdmin && (
                            <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-700">
                                <span className="text-sm text-gray-300 flex items-center gap-2">
                                    <Filter size={16} /> Vedi tutti i PG
                                </span>
                                <button 
                                    onClick={() => { toggleViewAll(); setIsMenuOpen(false); }}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${viewAll ? 'bg-green-600' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viewAll ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3. LISTA TAB DI NAVIGAZIONE */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase font-bold px-1 mb-2 mt-2 flex justify-between items-center">
                            Menu Rapido 
                            <span className="text-[10px] font-normal normal-case opacity-70"><Pin size={10} className="inline"/> fissa in basso</span>
                        </p>
                        
                        {AVAILABLE_TABS.map(tab => {
                            const isPinned = userShortcuts.includes(tab.id);
                            const isActive = activeTab === tab.id;
                            
                            // Badge count specifico per tab
                            let badgeCount = 0;
                            let badgeColor = 'bg-gray-600';
                            
                            if (tab.id === 'messaggi') { badgeCount = unreadCount; badgeColor = 'bg-purple-600'; }
                            // Se avessi una tab 'lavori'
                            // if (tab.id === 'jobs') { badgeCount = jobsCount; badgeColor = 'bg-amber-600'; }

                            return (
                                <div key={tab.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${isActive ? 'bg-indigo-900/40 border border-indigo-500/30' : 'hover:bg-gray-700/50 border border-transparent'}`}>
                                    <button 
                                        className="flex items-center gap-3 flex-1 text-left py-1"
                                        onClick={() => handleMenuNavigation(tab.id)}
                                    >
                                        <tab.icon size={20} className={isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-gray-200"} />
                                        <span className={`${isActive ? "text-indigo-100 font-bold" : "text-gray-300 group-hover:text-white"}`}>
                                            {tab.label}
                                        </span>
                                        {badgeCount > 0 && (
                                            <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${badgeColor}`}>
                                                {badgeCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleShortcut(tab.id);
                                        }}
                                        className={`p-2 rounded-full transition-colors ${isPinned ? 'text-amber-400 hover:bg-amber-400/10' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        {isPinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                                    </button>
                                </div>
                            );
                        })}

                        {/* LINK ADMIN AGGIUNTIVI */}
                        {isAdmin && (
                            <button onClick={() => handleMenuNavigation('admin_msg')} className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-900/20 text-red-300 hover:bg-red-900/30 mt-2 border border-red-900/30">
                                <Mail size={20} /> <span>Admin Messaggi</span>
                                {adminPendingCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{adminPendingCount}</span>}
                            </button>
                        )}
                    </div>
                </div>

                {/* DRAWER FOOTER (VERSIONE & UPDATE) */}
                <div className="p-4 border-t border-gray-700 bg-gray-900/80 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-500 font-mono">v{APP_VERSION}</span>
                        {/* UPDATE BUTTON FORCE */}
                        <button 
                            onClick={() => updateServiceWorker(true)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${needRefresh ? 'bg-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <RefreshCw size={14} className={needRefresh ? "animate-spin" : ""} />
                            {needRefresh ? "AGGIORNA ORA" : "Verifica Agg."}
                        </button>
                    </div>
                    
                    <button 
                        onClick={onLogout} 
                        className="w-full flex items-center justify-center gap-2 p-2 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 transition-colors text-sm font-bold"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto relative bg-gray-900 scrollbar-hide">
        {renderTabContent()}
      </main>

      {/* --- BOTTOM NAV --- */}
      <nav className="flex justify-around items-center bg-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] shrink-0 border-t border-gray-700 z-10 h-[60px] pb-safe">
        {/* Tasti Fissi */}
        <TabButton icon={<Gamepad2 size={24} />} label="Game" isActive={activeTab === 'game'} onClick={() => setActiveTab('game')} />
        <TabButton icon={<Home size={24} />} label="Scheda" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        
        <div className="w-px h-8 bg-gray-700 mx-1 opacity-50"></div>

        {/* Tasti Dinamici */}
        {userShortcuts.map(tabId => {
            const tab = AVAILABLE_TABS.find(t => t.id === tabId);
            if (!tab) return null;
            
            // Badge anche sulla bottom bar se importante
            let showDot = false;
            let dotColor = 'bg-red-500';
            if (tab.id === 'messaggi' && hasMsgNotif) { showDot = true; dotColor = 'bg-purple-500'; }
            
            return (
                <TabButton 
                    key={tabId}
                    icon={<tab.icon size={24} />} 
                    label={tab.label} 
                    isActive={activeTab === tabId} 
                    onClick={() => setActiveTab(tabId)} 
                    notificationDot={showDot}
                    dotColor={dotColor}
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

// Componente TabButton potenziato con supporto notifica
const TabButton = ({ icon, label, isActive, onClick, notificationDot, dotColor }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-1 min-w-14 h-full transition-all duration-200 ${isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'} focus:outline-none relative group`}>
    
    <div className={`transition-transform duration-200 ${isActive ? '-translate-y-1 scale-110' : 'group-active:scale-95'}`}>
        {icon}
        {notificationDot && (
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-gray-800 ${dotColor}`}></span>
        )}
    </div>
    
    <span className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-16 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>{label}</span>
    
    {isActive && (
        <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-400 rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
    )}
  </button>
);

export default MainPage;