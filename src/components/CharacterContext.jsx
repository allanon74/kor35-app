import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  getMessages, 
  markMessageAsRead, 
  deleteMessage, 
  getAdminPendingProposalsCount, 
  saveWebPushSubscription 
} from '../api'; 
import NotificationPopup from './NotificationPopup';

// Importiamo gli hook creati prima
import { 
  usePunteggi, 
  usePersonaggiList, 
  usePersonaggioDetail, 
  useAcquirableSkills, 
  useAcquirableInfusioni, 
  useAcquirableTessiture 
} from '../hooks/useGameData';

const CharacterContext = createContext(null);

// --- HELPER UTILS ---
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const sendSystemNotification = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
          new Notification(title, { body, icon: '/pwa-192x192.png', vibrate: [200, 100, 200] });
      } catch (e) { console.error("Errore notifica:", e); }
    }
};

export const CharacterProvider = ({ children, onLogout }) => {
  const queryClient = useQueryClient(); // Accesso alla cache globale
  
  // --- STATI GLOBALI UI ---
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => localStorage.getItem('kor35_last_char_id') || '');
  const [isAdmin] = useState(() => localStorage.getItem('kor35_is_staff') === 'true');
  const [viewAll, setViewAll] = useState(false);
  
  // --- REACT QUERY HOOKS (Sostituiscono le fetch manuali) ---
  
  // 1. Punteggi (Caricati una volta sola e cachati per sempre)
  const { data: punteggiList = [], isLoading: isLoadingPunteggi } = usePunteggi(onLogout);

  // 2. Lista Personaggi
  const { 
    data: personaggiList = [], 
    isLoading: isLoadingList, 
    refetch: refetchPersonaggiList 
  } = usePersonaggiList(onLogout, viewAll);

  // 3. Dettaglio Personaggio Selezionato
  const { 
    data: selectedCharacterData, 
    isLoading: isLoadingDetail,
    refetch: refetchCharacterDetail
  } = usePersonaggioDetail(selectedCharacterId, onLogout);

  // 4. Dati Lazy Loading (Abilità, Infusioni, Tessiture)
  // Questi vengono chiamati automaticamente ma React Query li esegue solo se 'enabled' è true (cioè c'è un ID)
  // Inoltre, i componenti che li usano accederanno ai dati via Context
  const { data: acquirableSkills = [] } = useAcquirableSkills(selectedCharacterId, onLogout);
  const { data: acquirableInfusioni = [] } = useAcquirableInfusioni(selectedCharacterId);
  const { data: acquirableTessiture = [] } = useAcquirableTessiture(selectedCharacterId);

  // --- LOGICA SELEZIONE AUTOMATICA PG ---
  useEffect(() => {
    // Se non c'è un PG selezionato ma la lista è caricata, selezioniamo il primo o quello in cache
    if (!selectedCharacterId && personaggiList.length > 0) {
        const lastId = localStorage.getItem('kor35_last_char_id');
        const targetId = (lastId && personaggiList.some(p => p.id.toString() === lastId)) 
                         ? lastId 
                         : personaggiList[0].id;
        setSelectedCharacterId(targetId);
    }
  }, [personaggiList, selectedCharacterId]);

  // --- AZIONI CONTEXT ---
  
  const handleSelectCharacter = useCallback((id) => {
    setSelectedCharacterId(id);
    if(id) localStorage.setItem('kor35_last_char_id', id);
    // Non serve fetchare nulla, React Query reagisce al cambio di selectedCharacterId
  }, []);

  const refreshCharacterData = useCallback(() => {
    // Ricarica forzatamente i dati del PG attuale
    refetchCharacterDetail();
  }, [refetchCharacterDetail]);

  const fetchPersonaggi = useCallback(() => {
    // Wrapper per ricaricare la lista (usato dal tasto refresh nella home)
    refetchPersonaggiList();
  }, [refetchPersonaggiList]);

  const toggleViewAll = () => setViewAll(prev => !prev);


  // --- GESTIONE MESSAGGI (Mantenuta manuale per ora per gestire Read/Delete) ---
  const [userMessages, setUserMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUserMessages = useCallback(async (charId) => {
    if (!charId) return;
    try {
      const msgs = await getMessages(charId, onLogout);
      const sorted = (msgs || []).sort((a, b) => {
        if (a.letto !== b.letto) return a.letto ? 1 : -1;
        return new Date(b.data_invio) - new Date(a.data_invio);
      });
      setUserMessages(sorted);
      setUnreadCount(sorted.filter(m => !m.letto).length);
    } catch (err) { console.error("Err msg:", err); }
  }, [onLogout]);

  // Aggiorna messaggi al cambio PG
  useEffect(() => {
    if (selectedCharacterId) fetchUserMessages(selectedCharacterId);
  }, [selectedCharacterId, fetchUserMessages]);

  const handleMarkAsRead = async (msgId) => {
      setUserMessages(prev => prev.map(m => m.id === msgId ? { ...m, letto: true } : m)); // Optimistic
      setUnreadCount(prev => Math.max(0, prev - 1));
      try { await markMessageAsRead(msgId, selectedCharacterId, onLogout); } 
      catch (e) { fetchUserMessages(selectedCharacterId); }
  };

  const handleDeleteMessage = async (msgId) => {
      if(!window.confirm("Cancellare messaggio?")) return;
      setUserMessages(prev => prev.filter(m => m.id !== msgId)); // Optimistic
      try { await deleteMessage(msgId, selectedCharacterId, onLogout); } 
      catch (e) { fetchUserMessages(selectedCharacterId); }
  };


  // --- ADMIN & NOTIFICHE (Mantenuto logica esistente) ---
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  useEffect(() => {
      if (isAdmin && !viewAll) {
          const check = async () => {
              try { const d = await getAdminPendingProposalsCount(onLogout); setAdminPendingCount(d.count); } 
              catch (e) {}
          };
          check();
          const i = setInterval(check, 60000);
          return () => clearInterval(i);
      }
  }, [isAdmin, viewAll, onLogout]);

  // WebPush
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            const key = urlBase64ToUint8Array("BIOIApSIeJdV1tp5iVxyLtm8KzM43_AQWV2ymS4iMjkIG1R5g399o6WRdZJY-xcUBZPyJ7EFRVgWqlbalOkGSYw");
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        }
        await saveWebPushSubscription(sub, onLogout);
    } catch (e) { console.error("WebPush Error:", e); }
  }, [onLogout]);

  useEffect(() => { if (selectedCharacterId) subscribeToPush(); }, [selectedCharacterId, subscribeToPush]);

  // WebSocket
  const [notification, setNotification] = useState(null);
  const ws = useRef(null);
  useEffect(() => {
    const wsUrl = window.location.hostname === 'localhost' ? 'ws://127.0.0.1:8000/ws/notifications/' : `wss://www.kor35.it/ws/notifications/`;
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'notification') {
           const msg = d.payload;
           const myId = parseInt(selectedCharacterId);
           if (msg.tipo === 'BROAD' || (msg.tipo === 'INDV' && msg.destinatario_id === myId) || msg.tipo === 'GROUP') {
              setNotification(msg);
              sendSystemNotification(msg.titolo, msg.testo.replace(/<[^>]+>/g, ''));
              fetchUserMessages(selectedCharacterId);
              // Invalida cache messaggi o ricarica se necessario
              queryClient.invalidateQueries(['personaggio', selectedCharacterId]);
           }
        }
      } catch (err) {}
    };
    return () => { if (ws.current) ws.current.close(); };
  }, [selectedCharacterId, fetchUserMessages, queryClient]);


  // --- VALUE DEL CONTEXT ---
  const value = {
    // Dati da React Query
    personaggiList,
    punteggiList,
    selectedCharacterId,
    selectedCharacterData,
    
    // Liste "Acquistabili" (auto-gestite da cache)
    acquirableSkills,
    acquirableInfusioni,
    acquirableTessiture,
    
    // Loading states combinati
    isLoading: isLoadingList || isLoadingDetail || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    
    // Funzioni
    selectCharacter: handleSelectCharacter,
    refreshCharacterData,
    fetchPersonaggi, // Mantenuto per compatibilità, ora fa refetch
    
    // Placeholder (non servono più chiamate manuali, ma le lasciamo vuote per non rompere i componenti figli)
    loadSkillsOnDemand: () => {}, 
    loadInfusioniOnDemand: () => {},
    loadTessitureOnDemand: () => {},

    // Admin & Messaggi
    isAdmin,
    viewAll,
    toggleViewAll,
    adminPendingCount,
    userMessages,
    unreadCount,
    fetchUserMessages,
    handleMarkAsRead,
    handleDeleteMessage,
    subscribeToPush,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  return context;
};