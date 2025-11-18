import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, 
  getPunteggiList,
} from '../api'; // IMPORT STANDARD (senza estensione)

// 1. Creare il Context
const CharacterContext = createContext(null);

// 2. Creare il Provider (il "contenitore" dei dati)
export const CharacterProvider = ({ children, onLogout }) => {
  const [personaggiList, setPersonaggiList] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [selectedCharacterData, setSelectedCharacterData] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  // --- STATI MODIFICATI ---
  const [acquirableSkills, setAcquirableSkills] = useState([]);
  const [isLoadingAcquirable, setIsLoadingAcquirable] = useState(false);
  // ---

  // LOGICA ADMIN
  const [isAdmin] = useState(() => {
      const isStaff = localStorage.getItem('kor35_is_staff');
      console.log("🔎 DEBUG KOR-35 - Stato Admin caricato:", isStaff); 
      return isStaff === 'true'; 
  });
  const [viewAll, setViewAll] = useState(false);

  const [punteggiList, setPunteggiList] = useState([]);
  const [isLoadingPunteggi, setIsLoadingPunteggi] = useState(false);

  // Funzione per selezionare un personaggio
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
      await fetchAcquirableSkills(id); // Carica le abilità acquistabili per il personaggio selezionato

    } catch (err) {
      setError(err.message || `Impossibile caricare i dati per il personaggio ${id}.`);
      setSelectedCharacterData(null);
      setSelectedCharacterId(''); // Resetta l'ID se il caricamento fallisce
    } finally {
      setIsLoadingDetail(false);
    }
  }, [onLogout, selectedCharacterId, fetchAcquirableSkills]); 

  // Funzione abilità acquistabili
  const fetchAcquirableSkills = useCallback(async (characterId) => { // <-- AGGIUNTA characterId
    if (!characterId) {
        setAcquirableSkills([]); // Pulisce se non c'è ID
        return;
    }
    setIsLoadingAcquirable(true);
    try {
      // MODIFICA: Passa l'ID al chiamante API
      const data = await getAcquirableSkills(onLogout, characterId);
      setAcquirableSkills(data || []);
    } catch (err) {
      setError(err.message || 'Impossibile caricare la lista delle abilità acquistabili.');
      setAcquirableSkills([]);
    } finally {
      setIsLoadingAcquirable(false);
    }
  }, [onLogout]);

  // Funzione punteggi
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


  // Funzione per caricare la lista dei personaggi
  const fetchPersonaggi = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    
    // Carica la lista personaggi e i punteggi in parallelo.
    // fetchAcquirableSkills è ora chiamato dentro selectCharacter.
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
              
              // Chiama selectCharacter (che a sua volta chiama fetchAcquirableSkills(id))
              await selectCharacter(charToSelect || '');
              
            } catch (err) {
              setError(err.message || 'Impossibile caricare la lista personaggi.');
              setPersonaggiList([]);
            }
        })(),
        // RIMOSSA: fetchAcquirableSkills(), ora gestita da selectCharacter
        fetchPunteggi() // MANTENUTA: lista globale
    ]);
    
    setIsLoadingList(false); 
    
  }, [onLogout, viewAll, selectCharacter, fetchPunteggi]);

  // Funzione toggle checkbox admin
  const toggleViewAll = () => {
      setViewAll(prev => !prev);
  };

  // Funzione Refresh Dati
  const refreshCharacterData = useCallback(async () => {
    if (selectedCharacterId) {
      setIsLoadingDetail(true);
      setIsLoadingAcquirable(true);
      
      try {
        await Promise.all([
          // selectCharacter è sufficiente: forza il refresh dei dettagli e ricarica le abilità acquistabili
          selectCharacter(selectedCharacterId, true), 
          // RIMOSSA: fetchAcquirableSkills() è già chiamata in selectCharacter
        ]);
      } catch (err) {
          console.error("Errore durante il refresh:", err);
          setError(err.message || "Errore durante l'aggiornamento.");
      } finally {
          setIsLoadingDetail(false);
          setIsLoadingAcquirable(false);
      }
    }
  }, [selectedCharacterId, selectCharacter]);


  // Funzione wrapper selezione
  const handleSelectCharacter = async (id) => {
    localStorage.setItem('kor35_last_char_id', id);
    await selectCharacter(id, false);
  };


  // Dati che rendiamo disponibili a tutta l'app
  const value = {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,

    // Stati di caricamento
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

    // Admin & Filtri
    isAdmin,
    viewAll,
    toggleViewAll,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// 3. Creare l'Hook custom
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === null) {
    throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  }
  return context;
};