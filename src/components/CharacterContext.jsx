import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { 
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, // <-- MODIFICA: Sostituito getAbilitaMasterList
  getPunteggiList,
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

  // --- STATI MODIFICATI ---
  // Rimosse le righe di masterSkillsList e isLoadingSkills
  const [acquirableSkills, setAcquirableSkills] = useState([]);
  const [isLoadingAcquirable, setIsLoadingAcquirable] = useState(false);
  // ---

  const [punteggiList, setPunteggiList] = useState([]);
  const [isLoadingPunteggi, setIsLoadingPunteggi] = useState(false);

  // Funzione per selezionare un personaggio (INVARIATA DAL TUO ORIGINALE)
  const selectCharacter = useCallback(async (id, forceRefresh = false) => {
    if (!id) {
        setSelectedCharacterId('');
        setSelectedCharacterData(null);
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
    } catch (err) {
      setError(err.message || `Impossibile caricare i dati per il personaggio ${id}.`);
      setSelectedCharacterData(null);
      setSelectedCharacterId(''); // Resetta l'ID se il caricamento fallisce
    } finally {
      setIsLoadingDetail(false);
    }
  }, [onLogout, selectedCharacterId]); // Dipendenze corrette

  // --- FUNZIONE MODIFICATA ---
  // Sostituita fetchMasterSkills con la nuova fetchAcquirableSkills
  const fetchAcquirableSkills = useCallback(async () => {
    setIsLoadingAcquirable(true);
    try {
      const data = await getAcquirableSkills(onLogout);
      setAcquirableSkills(data || []);
    } catch (err) {
      setError(err.message || 'Impossibile caricare la lista delle abilità acquistabili.');
      setAcquirableSkills([]);
    } finally {
      setIsLoadingAcquirable(false);
    }
  }, [onLogout]);

  // --- FUNZIONE SPOSTATA QUI (INVARIATA DAL TUO ORIGINALE) ---
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


  // Funzione per caricare la lista dei personaggi (MODIFICATA)
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
        fetchAcquirableSkills(), // <-- MODIFICA: Chiamata aggiornata
        fetchPunteggi() // Chiama la funzione
    ]);
    
    setIsLoadingList(false); // Ora setIsLoadingList indica il caricamento *iniziale*
    
  }, [onLogout, selectCharacter, fetchAcquirableSkills, fetchPunteggi]); // Dipendenze corrette


  // --- FUNZIONE DI REFRESH (MODIFICATA) ---
  // La tua versione originale ricaricava solo il personaggio.
  // Questa versione ricarica SIA il personaggio (per le "Possedute")
  // SIA le abilità acquistabili (per la tab "Acquista").
  const refreshCharacterData = useCallback(async () => {
    if (selectedCharacterId) {
      setIsLoadingDetail(true);
      setIsLoadingAcquirable(true);
      
      try {
        await Promise.all([
          selectCharacter(selectedCharacterId, true), // Forza refresh del PG
          fetchAcquirableSkills() // Ricarica la lista delle acquistabili
        ]);
      } catch (err) {
          console.error("Errore durante il refresh:", err);
          setError(err.message || "Errore durante l'aggiornamento.");
      } finally {
          setIsLoadingDetail(false);
          setIsLoadingAcquirable(false);
      }
    }
  }, [selectedCharacterId, selectCharacter, fetchAcquirableSkills]); // Dipendenze aggiornate


  // Funzione wrapper (INVARIATA)
  const handleSelectCharacter = async (id) => {
    localStorage.setItem('kor35_last_char_id', id);
    await selectCharacter(id, false);
  };


  // Dati che rendiamo disponibili a tutta l'app
  const value = {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,

    // --- VALORI MODIFICATI ---
    isLoading: isLoadingList || isLoadingDetail || isLoadingAcquirable || isLoadingPunteggi,
    isLoadingList,
    isLoadingDetail,
    isLoadingAcquirable, // <-- Nuovo
    isLoadingPunteggi,
    error,
    fetchPersonaggi,
    selectCharacter: handleSelectCharacter,
    refreshCharacterData,
    acquirableSkills, // <-- Nuovo (sostituisce masterSkillsList)
    // ---
    
    punteggiList,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// 3. Creare l'Hook custom (INVARIATO)
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === null) {
    throw new Error('useCharacter deve essere usato dentro un CharacterProvider');
  }
  return context;
};