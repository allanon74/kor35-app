import React, { createContext, useState, useContext, useCallback, useEffect } from 'react'; // <-- FIX: Aggiunto useEffect
import { getPersonaggiList, getPersonaggioDetail } from '../api';

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

  // Funzione per selezionare un personaggio e caricarne i dettagli
  // Definita PRIMA di fetchPersonaggi perché viene usata da essa
  const selectCharacter = useCallback(async (id) => {
    if (!id) {
        setSelectedCharacterId('');
        setSelectedCharacterData(null);
        return;
    }
    
    // Non ricaricare se è già selezionato
    if (id === selectedCharacterId) {
        return;
    }
    
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


  // Funzione per caricare la lista dei personaggi
  const fetchPersonaggi = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      // Assumiamo che l'API restituisca: [{ id: 1, nome: 'Gimli' }, ...]
      const data = await getPersonaggiList(onLogout);
      setPersonaggiList(data || []);
      
      // Se c'è una lista e nessun personaggio è selezionato,
      // seleziona il primo di default.
      // (Usiamo data[0].id e non selectedCharacterId per evitare dipendenze complesse)
      if (data && data.length > 0 && !localStorage.getItem('kor35_last_char_id')) {
         await selectCharacter(data[0].id);
         localStorage.setItem('kor35_last_char_id', data[0].id);
      } else if (localStorage.getItem('kor35_last_char_id')) {
          // Se abbiamo un ID salvato, usiamo quello
          await selectCharacter(localStorage.getItem('kor35_last_char_id'));
      }
      
    } catch (err) {
      setError(err.message || 'Impossibile caricare la lista personaggi.');
      setPersonaggiList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [onLogout, selectCharacter]); // FIX: Aggiunto 'selectCharacter' e rimosso 'selectedCharacterId'


  // Questo useEffect (che era alla riga 70) non è più necessario
  // Lo rimuovo per pulizia, la logica è gestita in fetchPersonaggi
  /*
  useEffect(() => {
    if (fetchPersonaggi.dependencyReady) {
       // Questo trucco evita un loop di dipendenze
    }
  }, [selectCharacter]);
  
  if (fetchPersonaggi) fetchPersonaggi.dependencyReady = true;
  */


  // Funzione wrapper per cambiare personaggio E salvarlo
  const handleSelectCharacter = async (id) => {
    localStorage.setItem('kor35_last_char_id', id);
    await selectCharacter(id);
  };


  // Dati che rendiamo disponibili a tutta l'app
  const value = {
    personaggiList,
    selectedCharacterId,
    selectedCharacterData,
    isLoading: isLoadingList || isLoadingDetail,
    isLoadingList,
    isLoadingDetail,
    error,
    fetchPersonaggi,
    selectCharacter: handleSelectCharacter, // Usiamo la funzione wrapper
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