import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPersonaggiList, getPersonaggioDetail, getAcquirableSkills, getMessages } from '../api'; // Assicurati che getMessages sia importato

const CharacterContext = createContext();

export const CharacterProvider = ({ children, onLogout }) => {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedCharacterData, setSelectedCharacterData] = useState(null);
  const [acquirableSkills, setAcquirableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  
  // NUOVO: Stato per il conteggio messaggi non letti
  const [unreadCount, setUnreadCount] = useState(0);

  // Carica la lista dei personaggi all'avvio
  useEffect(() => {
    loadCharacters();
  }, []);

  // Quando cambia il personaggio selezionato, carica i dettagli
  useEffect(() => {
    if (selectedCharacter) {
      loadCharacterDetails(selectedCharacter);
    } else {
      setSelectedCharacterData(null);
      setAcquirableSkills([]);
      setUnreadCount(0); // Reset conteggio se nessun PG selezionato
    }
  }, [selectedCharacter]);

  const loadCharacters = async () => {
    try {
      const data = await getPersonaggiList(onLogout, viewAll);
      setCharacters(data);
      if (data.length > 0 && !selectedCharacter) {
        setSelectedCharacter(data[0].id);
      }
    } catch (error) {
      console.error("Errore caricamento personaggi", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacterDetails = async (id) => {
    setLoading(true);
    try {
      const data = await getPersonaggioDetail(id, onLogout);
      setSelectedCharacterData(data);
      
      // Carica abilità acquistabili
      if (!viewAll) { // Solo se non è in modalità admin view-all
          try {
              const skills = await getAcquirableSkills(onLogout, id);
              setAcquirableSkills(skills);
          } catch (e) {
              console.error("Errore caricamento skills acquistabili", e);
          }
      }

      // NUOVO: Aggiorna il conteggio messaggi non letti
      updateUnreadCount(id);

    } catch (error) {
      console.error("Errore caricamento dettagli personaggio", error);
    } finally {
      setLoading(false);
    }
  };

  // NUOVO: Funzione per aggiornare il badge messaggi
  const updateUnreadCount = async (charId = selectedCharacter) => {
    if (!charId) return;
    try {
        const msgs = await getMessages(charId, onLogout);
        // Conta solo quelli dove is_letto è false
        const count = msgs.filter(m => !m.is_letto).length;
        setUnreadCount(count);
    } catch (error) {
        console.error("Errore conteggio messaggi non letti:", error);
    }
  };

  const handleCharacterChange = (event) => {
    setSelectedCharacter(event.target.value);
  };

  const refreshData = () => {
    if (selectedCharacter) {
      loadCharacterDetails(selectedCharacter);
    } else {
      loadCharacters();
    }
  };

  const toggleViewAll = () => {
    const newVal = !viewAll;
    setViewAll(newVal);
    // Ricarica la lista con il nuovo parametro
    setLoading(true);
    getPersonaggiList(onLogout, newVal).then(data => {
        setCharacters(data);
        // Se passiamo a viewAll e l'admin non ha PG propri nella lista, gestiamo la selezione
        if (data.length > 0) {
            setSelectedCharacter(data[0].id);
        } else {
            setSelectedCharacter('');
        }
        setLoading(false);
    });
  };

  return (
    <CharacterContext.Provider value={{
      characters,
      selectedCharacter,
      selectedCharacterData,
      acquirableSkills,
      loading,
      handleCharacterChange,
      refreshData,
      viewAll,
      toggleViewAll,
      // NUOVI VALORI ESPOSTI
      unreadCount, 
      updateUnreadCount,
      setUnreadCount // Utile per update ottimistici locali
    }}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => useContext(CharacterContext);