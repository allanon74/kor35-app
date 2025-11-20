import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { getMessages } from '../api'; 

const PlayerMessageTab = ({ onLogout }) => {
    const { selectedCharacterData, selectedCharacterId, isLoadingDetail } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchMessages = async () => {
            // Usa selectedCharacterId, che è quello che determina la selezione
            if (!selectedCharacterId) {
                setMessages([]); 
                return;
            }
            setIsLoading(true);
            setFetchError(null);
            try {
                // Passa l'ID selezionato all'API
                const data = await getMessages(selectedCharacterId, onLogout);
                setMessages(data || []);
            } catch (err) {
                setFetchError('Impossibile caricare i messaggi: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        // --- CORREZIONE: Chiamata della funzione ---
        fetchMessages(); 
        // -------------------------------------------

    }, [selectedCharacterId, onLogout]); 


    if (isLoadingDetail || isLoading) {
        return <div className="p-4 text-center text-gray-400">Caricamento messaggi...</div>;
    }

    if (!selectedCharacterId) {
        return <div className="p-4 text-center text-gray-500">Seleziona un personaggio per vedere i messaggi.</div>;
    }

    if (fetchError) {
        return <div className="p-4 text-red-400">Errore: {fetchError}</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Ultimi Messaggi Ricevuti</h2>
            {messages.length > 0 ? (
                messages.map(msg => (
                    <div key={msg.id} className="p-3 bg-gray-800 rounded mb-3 shadow-md">
                        <p className="font-semibold text-indigo-400">{msg.titolo}</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.testo}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Mittente: {msg.mittente} | Data: {new Date(msg.data_invio).toLocaleDateString()}
                        </p>
                    </div>
                ))
            ) : (
                <p className="text-gray-500">Nessun messaggio trovato.</p>
            )}
        </div>
    );
};

export default PlayerMessageTab;