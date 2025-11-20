import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, 
  getPunteggiList,
} from '../api'; 
import NotificationPopup from './NotificationPopup';

// 1. Creare il Context
const CharacterContext = createContext(null);

// Helper per inviare notifica di sistema
const sendSystemNotification = (title, body) => {
    if (!("Notification" in window)) {
      return;
    }
    
    if (Notification.permission === "granted") {
      try {
          new Notification(title, {
            body: body,
            icon: '/pwa-192x192.png', // Usa l'icona della tua PWA
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

  // --- NOTIFICHE REAL-TIME ---
  const [notification, setNotification] = useState(null);
  const ws = useRef(null);

  // LOGICA ADMIN
  const [isAdmin] = useState(() => {
      const isStaff = localStorage.getItem('kor35_is_staff');
      return isStaff === 'true'; 
  });
  const [viewAll, setViewAll] = useState(false);

  // Richiedi permessi notifiche al primo caricamento o login
  useEffect(() => {
      if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
      }
  }, []);

  // --- WEBSOCKET SETUP ---
  useEffect(() => {
    let wsUrl = '';
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = 'ws://127.0.0.1:8000/ws/notifications/';
    } else {
        const backendHost = 'www.kor35.it'; 
        wsUrl = `wss://${backendHost}/ws/notifications/`;
    }
    
    console.log('Tentativo connessione WebSocket a:', wsUrl);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket Connesso a:', wsUrl);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'notification') {
           const msg = data.payload;
           
           // --- FILTRO MESSAGGI ---
           const myCharId = parseInt(selectedCharacterId); 
           
           let shouldShow = false;

           if (msg.tipo === 'BROAD') {
               shouldShow = true;
           } else if (msg.tipo === 'INDV' && msg.destinatario_id === myCharId) {
               shouldShow = true;
           } else if (msg.tipo === 'GROUP') {
               shouldShow = true; 
           }

           if (shouldShow) {
              console.log("📩 Nuova notifica ricevuta:", msg.titolo);
              setNotification(msg); // Notifica In-App (Popup React)
              
              // --- NOTIFICA DI SISTEMA (Windows/Android/iOS) ---
              // Rimuoviamo i tag HTML dal testo per la notifica di sistema
              const plainText = msg.testo.replace(/<[^>]+>/g, '');
              sendSystemNotification(msg.titolo, plainText);
           }
        }
      } catch (e) {
        console.error("Errore parsing messaggio WS:", e);
      }
    };

    ws.current.onclose = () => {
      console.log('ℹ️ WebSocket Disconnesso');
    };

    ws.current.onerror = (err) => {
      console.error('⚠️ WebSocket Errore (Controlla console Network per dettagli)');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedCharacterId]); 

  const closeNotification = () => {
      setNotification(null);
  };

  // --- FUNZIONI API (INVARIATE) ---
  const fetchAcquirableSkills = useCallback(async (characterId) => {
    if (!characterId) {
        setAcquirableSkills([]); 
        return;
    }
    setIsLoadingAcquirable(true);
    try {
      const data = await getAcquirableSkills(onLogout, characterId);
      setAcquirableSkills(data || []);
    } catch (err) {
      setError(err.message || 'Impossibile caricare la lista delle abilità acquistabili.');
      setAcquirableSkills([]);
    } finally {
      setIsLoadingAcquirable(false);
    }
  }, [onLogout]);

  const selectCharacter = useCallback(async (id, forceRefresh = false) => {
    if (!id) {
        setSelectedCharacterId('');
        setSelectedCharacterData(null);
        await fetchAcquirableSkills('');
        return;
    }
    
    if (id === selectedCharacterId && !forceRefresh) {
        return;
    }
    
    setIsLoadingDetail(true);
    setError(null);
    setSelectedCharacterId(id);
    
    try {
      const data = await getPersonaggioDetail(id, onLogout);
      setSelectedCharacterData(data);
      await fetchAcquirableSkills(id); 
    } catch (err) {
      setError(err.message || `Impossibile caricare i dati per il personaggio ${id}.`);
      setSelectedCharacterData(null);
      setSelectedCharacterId(''); 
    } finally {
      setIsLoadingDetail(false);
    }
  }, [onLogout, selectedCharacterId]); 

  const fetchPunteggi = useCallback(async () => {
    setIsLoadingPunteggi(true);
    try {
      const data = await getPunteggiList(onLogout);
      setPunteggiList(data || []);
    } catch (err) {
      console.error("Errore caricamento punteggi:", err);
      setPunteggiList([]);
    } finally {
      setIsLoadingPunteggi(false);
    }
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
              setError(err.message || 'Impossibile caricare la lista personaggi.');
              setPersonaggiList([]);
            }
        })(),
        fetchPunteggi()
    ]);
    
    setIsLoadingList(false); 
  }, [onLogout, viewAll]); 

  const toggleViewAll = () => {
      setViewAll(prev => !prev);
  };

  const refreshCharacterData = useCallback(async () => {
    if (selectedCharacterId) {
      setIsLoadingDetail(true);
      setIsLoadingAcquirable(true);
      
      try {
        await selectCharacter(selectedCharacterId, true); 
      } catch (err) {
          console.error("Errore durante il refresh:", err);
          setError(err.message || "Errore durante l'aggiornamento.");
      } finally {
          setIsLoadingDetail(false);
          setIsLoadingAcquirable(false);
      }
    }
  }, [selectedCharacterId]); 

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
    acquirableSkills,
    punteggiList,
    isAdmin,
    viewAll,
    toggleViewAll,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
      <NotificationPopup 
          notification={notification} 
          onClose={closeNotification} 
      />
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === null) {
    throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  }
  return context;
};