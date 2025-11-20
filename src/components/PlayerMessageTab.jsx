import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { getMessages } from '../api'; // Da creare in api.js

const PlayerMessageTab = ({ onLogout }) => {
    const { selectedCharacterData, isLoadingDetail, error } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedCharacterData) return;
            setIsLoading(true);
            setFetchError(null);
            try {
                // Chiama la vista MessaggioListView
                const data = await getMessages(onLogout);
                setMessages(data || []);
            } catch (err) {
                setFetchError('Impossibile caricare i messaggi: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [selectedCharacterData, onLogout]);


    if (isLoadingDetail || isLoading) {
        return <div className="p-4 text-center text-gray-400">Caricamento messaggi...</div>;
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
            {/* TODO: Aggiungere logica per l'infinito scroll qui */}
        </div>
    );
};

export default PlayerMessageTab;