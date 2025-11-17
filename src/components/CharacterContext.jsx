import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAbilitaMasterList,
  getPunteggiList, // <-- Corretto
} from '../api';

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
  const [masterSkillsList, setMasterSkillsList] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  // NUOVO STATE PER I PUNTEGGI
  const [punteggiList, setPunteggiList] = useState([]);
  const [isLoadingPunteggi, setIsLoadingPunteggi] = useState(false);

  // Funzione per selezionare un personaggio e caricarne i dettagli
  const selectCharacter = useCallback(async (id, forceRefresh = false) => {
    if (!id) {
        setSelectedCharacterId('');
        setSelectedCharacterData(null);
        return;
    }
    
    // Non ricaricare se è già selezionato
    if (id === selectedCharacterId && !forceRefresh) {
        return;
    }
    
    // --- ERRORE RISOLTO ---
    // La funzione fetchPunteggi è stata spostata fuori da qui
    // --- FINE ERRORE ---

    setIsLoadingDetail(true);
    setError(null);
    setSelectedCharacterId(id);
    
    try {
      // Carica i dati completi del personaggio
      const data = await getPersonaggioDetail(id, onLogout);
      setSelectedCharacterData(data);
    } catch (err) {
      setError(err.message || `Impossibile caricare i dati per il personaggio ${id}.`);
      setSelectedCharacterData(null);
      setSelectedCharacterId(''); // Resetta l'ID se il caricamento fallisce
    } finally {
      setIsLoadingDetail(false);
    }
  }, [onLogout, selectedCharacterId]); // Dipendenze corrette

  // Funzione per caricare la master list
  const fetchMasterSkills = useCallback(async () => {
    setIsLoadingSkills(true);
    try {
      const data = await getAbilitaMasterList(onLogout);
      setMasterSkillsList(data || []);
    } catch (err) {
      setError(err.message || 'Impossibile caricare la lista delle abilità.');
      setMasterSkillsList([]);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [onLogout]);

  // --- FUNZIONE SPOSTATA QUI ---
  // Definita prima di fetchPersonaggi
  const fetchPunteggi = useCallback(async () => {
    setIsLoadingPunteggi(true);
    try {
      const data = await getPunteggiList(onLogout); // <-- Usa la funzione API corretta
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
    
    // Carica tutte e tre le liste in parallelo
    await Promise.all([
        (async () => {
            try {
              const data = await getPersonaggiList(onLogout);
              setPersonaggiList(data || []);
              
              const lastCharId = localStorage.getItem('kor35_last_char_id');
              
              if (lastCharId && data.some(p => p.id.toString() === lastCharId)) {
                  await selectCharacter(lastCharId);
              } else if (data && data.length > 0) {
                  await selectCharacter(data[0].id);
                  localStorage.setItem('kor35_last_char_id', data[0].id);
              }
              
            } catch (err) {
              setError(err.message || 'Impossibile caricare la lista personaggi.');
              setPersonaggiList([]);
            }
        })(),
        fetchMasterSkills(), // Chiama la funzione
        fetchPunteggi() // Chiama la funzione
    ]);
    
    setIsLoadingList(false); // Ora setIsLoadingList indica il caricamento *iniziale*
    
  }, [onLogout, selectCharacter, fetchMasterSkills, fetchPunteggi]); // Dipendenze corrette


  // Crea la funzione di REFRESH
  const refreshCharacterData = useCallback(async () => {
    if (selectedCharacterId) {
      // Chiama selectCharacter con 'forceRefresh = true'
      await selectCharacter(selectedCharacterId, true);
    }
  }, [selectedCharacterId, selectCharacter]);


  // Funzione wrapper per cambiare personaggio E salvarlo
  const handleSelectCharacter = async (id) => {
    localStorage.setItem('kor35_last_char_id', id);
    await selectCharacter(id, false);
  };


  // Dati che rendiamo disponibili a tutta l'app
  const value = {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,
    isLoading: isLoadingList || isLoadingDetail || isLoadingSkills || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    isLoadingSkills,
    isLoadingPunteggi,
    error,
    fetchPersonaggi,
    selectCharacter: handleSelectCharacter, // Usiamo la funzione wrapper
    refreshCharacterData,
    masterSkillsList,
    punteggiList,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// 3. Creare l'Hook custom per usarlo facilmente
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === null) {
    throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  }
  return context;
};