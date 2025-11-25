
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, 
  getPunteggiList,
  saveWebPushSubscription,
  getAcquirableInfusioni, 
  getAcquirableTessiture,
  getMessages,         // <--- Importato
  markMessageAsRead,   // <--- Importato
  deleteMessage,       // <--- Importato
  getAdminPendingProposalsCount
} from '../api'; 
import NotificationPopup from './NotificationPopup';

// 1. Creare il Context
const CharacterContext = createContext(null);

// --- HELPER FUNCTION PER WEBPUSH ---
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper per inviare notifica di sistema locale (Livello 1)
const sendSystemNotification = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
          new Notification(title, {
            body: body,
            icon: '/pwa-192x192.png',
            vibrate: [200, 100, 200]
          });
      } catch (e) {
          console.error("Errore invio notifica sistema:", e);
      }
    }
};

// 2. Creare il Provider
export const CharacterProvider = ({ children, onLogout }) => {
  const [personaggiList, setPersonaggiList] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [selectedCharacterData, setSelectedCharacterData] = useState(null);
  
  // Stati di caricamento
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingAcquirable, setIsLoadingAcquirable] = useState(false);
  const [isLoadingPunteggi, setIsLoadingPunteggi] = useState(false);
  
  const [error, setError] = useState(null);

  // Stati aggiuntivi
  const [acquirableSkills, setAcquirableSkills] = useState([]);
  const [punteggiList, setPunteggiList] = useState([]);

  // --- MESSAGGI UTENTE ---
  const [userMessages, setUserMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- NOTIFICHE REAL-TIME ---
  const [notification, setNotification] = useState(null);
  const ws = useRef(null);

  // LOGICA ADMIN
  const [isAdmin] = useState(() => {
      const isStaff = localStorage.getItem('kor35_is_staff');
      return isStaff === 'true'; 
  });
  const [viewAll, setViewAll] = useState(false);
  const [adminPendingCount, setAdminPendingCount] = useState(0);

  // Stati per Infusioni e Tessiture
  const [acquirableInfusioni, setAcquirableInfusioni] = useState([]);
  const [acquirableTessiture, setAcquirableTessiture] = useState([]);

  // Gestione Admin Pending Count
  useEffect(() => {
      if (isAdmin && !viewAll) { // Controlla solo se admin loggato come sé stesso
          const checkPending = async () => {
              try {
                  const data = await getAdminPendingProposalsCount(onLogout);
                  setAdminPendingCount(data.count);
              } catch (e) { console.error("Admin Count Error:", e); }
          };
          checkPending();
          const interval = setInterval(checkPending, 60000); // Check ogni minuto
          return () => clearInterval(interval);
      }
  }, [isAdmin, viewAll, onLogout]);

  // --- GESTIONE MESSAGGI USER ---
  const fetchUserMessages = useCallback(async (characterId) => {
    if (!characterId) return;
    try {
      const msgs = await getMessages(characterId, onLogout);
      
      // Ordina: non letti in cima, poi per data decrescente
      const sorted = (msgs || []).sort((a, b) => {
        // Nota: Assumo che il campo backend sia 'letto' (boolean)
        // Se è 'is_read', cambia 'letto' con 'is_read' qui sotto.
        const aRead = a.letto ? 1 : 0;
        const bRead = b.letto ? 1 : 0;
        
        if (aRead !== bRead) return aRead - bRead; // 0 (non letto) prima di 1 (letto)
        return new Date(b.data_invio) - new Date(a.data_invio);
      });
      
      setUserMessages(sorted);
      setUnreadCount(sorted.filter(m => !m.letto).length);
    } catch (err) {
      console.error("Errore caricamento messaggi:", err);
    }
  }, [onLogout]);

  const handleMarkAsRead = async (msgId) => {
      // Update Ottimistico
      const updated = userMessages.map(m => m.id === msgId ? { ...m, letto: true } : m);
      setUserMessages(updated);
      setUnreadCount(updated.filter(m => !m.letto).length);

      try {
          await markMessageAsRead(msgId, selectedCharacterId, onLogout);
      } catch (e) {
          console.error("Errore markAsRead:", e);
          fetchUserMessages(selectedCharacterId); // Revert
      }
  };

  const handleDeleteMessage = async (msgId) => {
      if(!window.confirm("Vuoi davvero cancellare questo messaggio?")) return;

      // Update Ottimistico
      const updated = userMessages.filter(m => m.id !== msgId);
      setUserMessages(updated);
      setUnreadCount(updated.filter(m => !m.letto).length);

      try {
          await deleteMessage(msgId, selectedCharacterId, onLogout);
      } catch (e) {
          console.error("Errore deleteMessage:", e);
          fetchUserMessages(selectedCharacterId); // Revert
      }
  };


  // --- SOTTOSCRIZIONE WEB PUSH (Livello 2) ---
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
        if (Notification.permission === 'default') {
             await Notification.requestPermission();
        }
        if (Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            const vapidPublicKey = "BIOIApSIeJdV1tp5iVxyLtm8KzM43_AQWV2ymS4iMjkIG1R5g399o6WRdZJY-xcUBZPyJ7EFRVgWqlbalOkGSYw"; 
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }
        await saveWebPushSubscription(subscription, onLogout);
        console.log("✅ WebPush Sottoscritto con successo!");

    } catch (error) {
        console.error("❌ Errore sottoscrizione WebPush:", error);
    }
  }, [onLogout]);

  useEffect(() => {
      if (selectedCharacterId) {
          subscribeToPush();
          fetchUserMessages(selectedCharacterId); // Carica messaggi al login/cambio pg
      }
  }, [selectedCharacterId, subscribeToPush, fetchUserMessages]);


  // --- WEBSOCKET SETUP (Livello 1) ---
  useEffect(() => {
    let wsUrl = '';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = 'ws://127.0.0.1:8000/ws/notifications/';
    } else {
        const backendHost = 'www.kor35.it'; 
        wsUrl = `wss://${backendHost}/ws/notifications/`;
    }
    
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
           const msg = data.payload;
           const myCharId = parseInt(selectedCharacterId); 
           let shouldShow = false;

           if (msg.tipo === 'BROAD') shouldShow = true;
           else if (msg.tipo === 'INDV' && msg.destinatario_id === myCharId) shouldShow = true;
           else if (msg.tipo === 'GROUP') shouldShow = true; 

           if (shouldShow) {
              setNotification(msg); 
              const plainText = msg.testo.replace(/<[^>]+>/g, ''); 
              sendSystemNotification(msg.titolo, plainText);
              // Ricarica messaggi per aggiornare il badge e la lista
              fetchUserMessages(selectedCharacterId);
           }
        }
      } catch (e) { console.error("Errore parsing messaggio WS:", e); }
    };

    return () => { if (ws.current) ws.current.close(); };
  }, [selectedCharacterId, fetchUserMessages]); 

  const closeNotification = () => setNotification(null);

  // --- ALTRE FETCH ---
  const fetchAcquirableSkills = useCallback(async (characterId) => {
    if (!characterId) { setAcquirableSkills([]); return; }
    try {
      const data = await getAcquirableSkills(onLogout, characterId);
      setAcquirableSkills(data || []);
    } catch (err) {
      console.error('Errore caricamento abilità:', err);
      setAcquirableSkills([]);
    } 
  }, [onLogout]);
  
  const fetchAcquirableInfusioni = useCallback(async (characterId) => {
    if (!characterId) { setAcquirableInfusioni([]); return; }
    try {
      const data = await getAcquirableInfusioni(characterId);
      setAcquirableInfusioni(data || []);
    } catch (err) { setAcquirableInfusioni([]); }
  }, []);

  const fetchAcquirableTessiture = useCallback(async (characterId) => {
    if (!characterId) { setAcquirableTessiture([]); return; }
    try {
      const data = await getAcquirableTessiture(characterId);
      setAcquirableTessiture(data || []);
    } catch (err) { setAcquirableTessiture([]); }
  }, []);


  // --- SELEZIONE PERSONAGGIO ---
  const selectCharacter = useCallback(async (id, forceRefresh = false) => {
    if (!id) {
        setSelectedCharacterId('');
        setSelectedCharacterData(null);
        setAcquirableSkills([]);
        return;
    }
    
    if (id === selectedCharacterId && !forceRefresh) return;
    
    setIsLoadingDetail(true);
    setIsLoadingAcquirable(true);
    setError(null);
    setSelectedCharacterId(id);
    
    try {
      const data = await getPersonaggioDetail(id, onLogout);
      setSelectedCharacterData(data);
      
      await Promise.all([
          fetchAcquirableSkills(id),
          fetchAcquirableInfusioni(id),
          fetchAcquirableTessiture(id)
      ]);

    } catch (err) {
      setError(err.message);
      setSelectedCharacterData(null);
    } finally {
      setIsLoadingDetail(false);
      setIsLoadingAcquirable(false);
    }
  }, [onLogout, selectedCharacterId, fetchAcquirableSkills, fetchAcquirableInfusioni, fetchAcquirableTessiture]); 

  const fetchPunteggi = useCallback(async () => {
    setIsLoadingPunteggi(true);
    try {
      const data = await getPunteggiList(onLogout);
      setPunteggiList(data || []);
    } catch (err) { setPunteggiList([]); } finally { setIsLoadingPunteggi(false); }
  }, [onLogout]);

  const fetchPersonaggi = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    await Promise.all([
        (async () => {
            try {
              const data = await getPersonaggiList(onLogout, viewAll); 
              setPersonaggiList(data || []);
              
              const lastCharId = localStorage.getItem('kor35_last_char_id');
              let charToSelect = null;
              
              if (lastCharId && data.some(p => p.id.toString() === lastCharId)) {
                  charToSelect = lastCharId;
              } else if (data && data.length > 0) {
                  charToSelect = data[0].id;
                  localStorage.setItem('kor35_last_char_id', data[0].id);
              }
              await selectCharacter(charToSelect || '');
            } catch (err) {
              setError(err.message);
              setPersonaggiList([]);
            }
        })(),
        fetchPunteggi()
    ]);
    setIsLoadingList(false); 
  }, [onLogout, viewAll, selectCharacter, fetchPunteggi]); 

  const toggleViewAll = () => setViewAll(prev => !prev);

  const refreshCharacterData = useCallback(async () => {
    if (selectedCharacterId) await selectCharacter(selectedCharacterId, true);
  }, [selectedCharacterId, selectCharacter]); 

  const handleSelectCharacter = async (id) => {
    localStorage.setItem('kor35_last_char_id', id);
    await selectCharacter(id, false);
  };

  const value = {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,
    isLoading: isLoadingList || isLoadingDetail || isLoadingAcquirable || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    isLoadingAcquirable,
    isLoadingPunteggi,
    error,
    fetchPersonaggi,
    selectCharacter: handleSelectCharacter,
    refreshCharacterData,
    
    punteggiList,
    acquirableSkills,
    acquirableInfusioni, 
    acquirableTessiture, 
    
    isAdmin,
    viewAll,
    toggleViewAll,
    adminPendingCount,
    
    // Messaggi
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
      <NotificationPopup notification={notification} onClose={closeNotification} />
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === null) throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  return context;
};