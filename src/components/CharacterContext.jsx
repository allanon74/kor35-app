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

// 2. Creare il Provider (il "contenitore" dei dati)
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

  // --- WEBSOCKET SETUP ---
  useEffect(() => {
    // LOGICA URL WEBSOCKET CORRETTA [MODIFICATA]
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    
    // Se siamo in locale (localhost), usiamo la porta 8000.
    // Se siamo in produzione (app.kor35.it), NON specifichiamo la porta (usa la 443 di default gestita da Apache).
    const port = hostname === 'localhost' || hostname === '127.0.0.1' ? ':8000' : '';
    
    const wsUrl = `${protocol}//${hostname}${port}/ws/notifications/`;
    
    console.log('Tentativo connessione WebSocket a:', wsUrl);

    // 2. Inizializza connessione
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
              setNotification(msg);
           }
        }
      } catch (e) {
        console.error("Errore parsing messaggio WS:", e);
      }
    };

    ws.current.onclose = () => {
      // Non loggare come errore, è normale durante i refresh o logout
      console.log('ℹ️ WebSocket Disconnesso');
    };

    ws.current.onerror = (err) => {
      console.error('⚠️ WebSocket Errore (Controlla console Network per dettagli)');
    };

    // Cleanup alla chiusura del componente o cambio personaggio
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedCharacterId]); 

  const closeNotification = () => {
      setNotification(null);
  };

  // --- FUNZIONI API ---

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
    
    // Stati Loading
    isLoading: isLoadingList || isLoadingDetail || isLoadingAcquirable || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    isLoadingAcquirable,
    isLoadingPunteggi,
    error,
    
    // Funzioni
    fetchPersonaggi,
    selectCharacter: handleSelectCharacter,
    refreshCharacterData,
    acquirableSkills,
    punteggiList,

    // Admin
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