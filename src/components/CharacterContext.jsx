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
  const queryClient = useQueryClient(); 
  
  // --- STATI GLOBALI UI ---
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => localStorage.getItem('kor35_last_char_id') || '');
  const [isAdmin] = useState(() => localStorage.getItem('kor35_is_staff') === 'true');
  const [viewAll, setViewAll] = useState(false);
  
  // --- REACT QUERY HOOKS ---
  
  // 1. Punteggi
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

  // 4. Dati Lazy Loading
  const { data: acquirableSkills = [] } = useAcquirableSkills(selectedCharacterId, onLogout);
  const { data: acquirableInfusioni = [] } = useAcquirableInfusioni(selectedCharacterId);
  const { data: acquirableTessiture = [] } = useAcquirableTessiture(selectedCharacterId);

  // --- LOGICA SELEZIONE AUTOMATICA PG ---
  useEffect(() => {
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
  }, []);

  const refreshCharacterData = useCallback(() => {
    refetchCharacterDetail();
  }, [refetchCharacterDetail]);

  const fetchPersonaggi = useCallback(() => {
    refetchPersonaggiList();
  }, [refetchPersonaggiList]);

  const toggleViewAll = () => setViewAll(prev => !prev);

  // --- GESTIONE MESSAGGI ---
  const [userMessages, setUserMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUserMessages = useCallback(async (charId) => {
    if (!charId) return;
    try {
      const rawMsgs = await getMessages(charId, onLogout);
      const msgs = (rawMsgs || []).map(msg => ({
          ...msg,
          letto: msg.is_letto 
      }));
      const sorted = (msgs || []).sort((a, b) => {
        if (a.letto !== b.letto) return a.letto ? 1 : -1;
        return new Date(b.data_invio) - new Date(a.data_invio);
      });
      setUserMessages(sorted);
      setUnreadCount(sorted.filter(m => !m.letto).length);
    } catch (err) { console.error("Err msg:", err); }
  }, [onLogout]);

  useEffect(() => {
    if (selectedCharacterId) fetchUserMessages(selectedCharacterId);
  }, [selectedCharacterId, fetchUserMessages]);

  const handleMarkAsRead = async (msgId) => {
      setUserMessages(prev => prev.map(m => m.id === msgId ? { ...m, letto: true } : m)); 
      setUnreadCount(prev => Math.max(0, prev - 1));
      try { await markMessageAsRead(msgId, selectedCharacterId, onLogout); } 
      catch (e) { fetchUserMessages(selectedCharacterId); }
  };

  const handleDeleteMessage = async (msgId) => {
      if(!window.confirm("Cancellare messaggio?")) return;
      setUserMessages(prev => prev.filter(m => m.id !== msgId)); 
      try { await deleteMessage(msgId, selectedCharacterId, onLogout); } 
      catch (e) { fetchUserMessages(selectedCharacterId); }
  };

  // --- ADMIN & NOTIFICHE ---
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
              queryClient.invalidateQueries(['personaggio', selectedCharacterId]);
           }
        }
      } catch (err) {}
    };
    return () => { if (ws.current) ws.current.close(); };
  }, [selectedCharacterId, fetchUserMessages, queryClient]);


  // --- VALUE DEL CONTEXT (CORRETTO) ---
  const value = {
    personaggiList,
    punteggiList,
    selectedCharacterId,
    
    // *** CORREZIONE QUI ***
    // Mappiamo selectedCharacterData sulla chiave 'characterData'
    // così i componenti che usano const { characterData } = useCharacter() funzionano
    characterData: selectedCharacterData, 
    
    // Lasciamo anche selectedCharacterData per sicurezza/backward compatibility
    selectedCharacterData,
    
    acquirableSkills,
    acquirableInfusioni,
    acquirableTessiture,
    
    isLoading: isLoadingList || isLoadingDetail || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    
    selectCharacter: handleSelectCharacter,
    refreshCharacterData,
    fetchPersonaggi, 
    
    loadSkillsOnDemand: () => {}, 
    loadInfusioniOnDemand: () => {},
    loadTessitureOnDemand: () => {},

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