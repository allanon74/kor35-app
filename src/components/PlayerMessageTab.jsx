import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext'; // Assicurati che il percorso sia corretto
import { getMessages, markMessageAsRead, deleteMessage } from '../api'; // Le funzioni create nel passaggio precedente
import { TrashIcon, EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline'; // Icone Heroicons (presenti nel tuo package.json)

const PlayerMessageTab = ({ onLogout }) => {
    const { selectedCharacterData: char } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Caricamento messaggi all'avvio o al cambio PG
    useEffect(() => {
        if (char?.id) {
            loadMessages();
        }
    }, [char]);

    const loadMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMessages(char.id, onLogout);
            setMessages(data);
        } catch (err) {
            console.error("Errore caricamento messaggi:", err);
            setError("Impossibile caricare i messaggi.");
        } finally {
            setLoading(false);
        }
    };

    // Gestione "Segna come letto"
    const handleMarkAsRead = async (msg) => {
        if (msg.is_letto) return; // Se è già letto, non fare nulla

        // 1. Aggiornamento Ottimistico dell'UI (immediato)
        const updatedMessages = messages.map(m => 
            m.id === msg.id ? { ...m, is_letto: true } : m
        );
        setMessages(updatedMessages);

        // 2. Chiamata API in background
        try {
            await markMessageAsRead(msg.id, char.id, onLogout);
        } catch (err) {
            console.error("Errore durante la lettura", err);
            // In caso di errore, potresti voler ricaricare i messaggi originali
        }
    };

    // Gestione "Cancella messaggio"
    const handleDelete = async (msgId, e) => {
        e.stopPropagation(); // Evita di attivare il click del "Segna come letto"
        
        if (!window.confirm("Sei sicuro di voler cancellare questo messaggio?")) return;

        // 1. Aggiornamento Ottimistico dell'UI (rimuove il messaggio dalla lista)
        const updatedMessages = messages.filter(m => m.id !== msgId);
        setMessages(updatedMessages);

        // 2. Chiamata API
        try {
            await deleteMessage(msgId, char.id, onLogout);
        } catch (err) {
            console.error("Errore cancellazione", err);
            alert("Errore durante la cancellazione del messaggio.");
            loadMessages(); // Ricarica la lista reale in caso di errore
        }
    };

    if (loading) return <div className="p-4 text-gray-400 animate-pulse">Caricamento messaggi...</div>;
    if (error) return <div className="p-4 text-red-400">{error}</div>;
    if (!messages || messages.length === 0) return <div className="p-4 text-gray-500 italic">Nessun messaggio ricevuto.</div>;

    return (
        <div className="space-y-3">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    onClick={() => handleMarkAsRead(msg)}
                    className={`
                        relative group p-4 rounded-lg border transition-all cursor-pointer
                        ${msg.is_letto 
                            ? 'bg-gray-800 border-gray-700 opacity-75 hover:opacity-100' // Stile Messaggio Letto
                            : 'bg-gray-700 border-indigo-500 shadow-md ring-1 ring-indigo-500/30' // Stile Messaggio Non Letto
                        }
                    `}
                >
                    <div className="flex justify-between items-start gap-4">
                        {/* Icona Busta */}
                        <div className={`mt-1 shrink-0 ${msg.is_letto ? 'text-gray-500' : 'text-indigo-400'}`}>
                            {msg.is_letto ? <EnvelopeOpenIcon className="w-6 h-6" /> : <EnvelopeIcon className="w-6 h-6" />}
                        </div>

                        {/* Contenuto Messaggio */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className={`text-base font-bold truncate pr-2 ${msg.is_letto ? 'text-gray-300' : 'text-white'}`}>
                                    {msg.titolo}
                                </h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(msg.data_invio).toLocaleDateString()} {new Date(msg.data_invio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-2 font-medium">
                                Da: <span className="text-gray-300">{msg.mittente}</span>
                            </p>
                            
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.is_letto ? 'text-gray-400' : 'text-gray-200'}`}>
                                {msg.testo}
                            </p>
                        </div>

                        {/* Pulsante Cancella (Visibile in hover su desktop, sempre su mobile se vuoi adattarlo) */}
                        <button 
                            onClick={(e) => handleDelete(msg.id, e)}
                            className="
                                shrink-0 p-2 rounded-full 
                                text-gray-500 hover:text-red-500 hover:bg-gray-900 
                                transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                            "
                            title="Cancella messaggio"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Indicatore "Nuovo" (Pallino blu) */}
                    {!msg.is_letto && (
                        <span className="absolute top-3 right-3 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PlayerMessageTab;