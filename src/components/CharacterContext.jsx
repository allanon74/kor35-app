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

// --- HELPER FUNCTION PER WEBPUSH ---
// Converte la chiave VAPID da base64 url-safe a Uint8Array richiesto dal browser
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
    if (!("Notification" in window)) {
      return;
    }
    
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

  // --- NOTIFICHE REAL-TIME ---
  const [notification, setNotification] = useState(null);
  const ws = useRef(null);

  // LOGICA ADMIN
  const [isAdmin] = useState(() => {
      const isStaff = localStorage.getItem('kor35_is_staff');
      return isStaff === 'true'; 
  });
  const [viewAll, setViewAll] = useState(false);

  // --- SOTTOSCRIZIONE WEB PUSH (Livello 2) ---
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
        // Richiede i permessi se non già concessi o negati
        if (Notification.permission === 'default') {
             await Notification.requestPermission();
        }
        
        if (Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        
        // Controlla se esiste già una sottoscrizione
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // *** SOSTITUISCI CON LA TUA CHIAVE VAPID REALE ***
            const vapidPublicKey = "BIOIApSIeJdV1tp5iVxyLtm8KzM43_AQWV2ymS4iMjkIG1R5g399o6WRdZJY-xcUBZPyJ7EFRVgWqlbalOkGSYw"; 
            
            if (vapidPublicKey === "INSERISCI_QUI_LA_TUA_VAPID_PUBLIC_KEY") {
                 console.warn("VAPID Key non configurata nel CharacterContext. Le notifiche Push non funzioneranno.");
                 return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

        // Invia la sottoscrizione al backend Django
        // Nota: Includiamo le credenziali per associare la sottoscrizione all'utente loggato
        // (Assumendo che il backend usi sessioni/cookie per l'auth)
        await fetch('https://www.kor35.it/webpush/save_information', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Se usi un token CSRF, aggiungilo qui, es:
                // 'X-CSRFToken': getCookie('csrftoken') 
            },
            body: JSON.stringify(subscription)
        });

        console.log("✅ WebPush Sottoscritto con successo!");

    } catch (error) {
        console.error("❌ Errore sottoscrizione WebPush:", error);
    }
  }, []);

  // Effettua la sottoscrizione quando c'è un personaggio selezionato (utente loggato)
  useEffect(() => {
      if (selectedCharacterId) {
          subscribeToPush();
      }
  }, [selectedCharacterId, subscribeToPush]);


  // --- WEBSOCKET SETUP (Livello 1) ---
  useEffect(() => {
    let wsUrl = '';
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = 'ws://127.0.0.1:8000/ws/notifications/';
    } else {
        const backendHost = 'www.kor35.it'; 
        wsUrl = `wss://${backendHost}/ws/notifications/`;
    }
    
    console.log('Tentativo connessione WebSocket a:', wsUrl);

    // Chiudi eventuale connessione precedente
    if (ws.current) ws.current.close();

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket Connesso');
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
               // Logica base: mostra se appartiene a un gruppo (raffinabile)
               shouldShow = true; 
           }

           if (shouldShow) {
              console.log("📩 Nuova notifica ricevuta:", msg.titolo);
              
              // 1. Notifica In-App (Popup React)
              setNotification(msg); 
              
              // 2. Notifica di Sistema Locale (se l'app è aperta/in background)
              // Utile su Desktop per avvisare senza guardare la tab
              const plainText = msg.testo.replace(/<[^>]+>/g, ''); // Rimuovi HTML
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
      console.error('⚠️ WebSocket Errore (Vedi Network tab)');
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
    subscribeToPush,
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