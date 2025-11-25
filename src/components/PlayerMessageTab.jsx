import React, { useState, useEffect } from 'react';
import { 
    TrashIcon, 
    EnvelopeIcon, 
    EnvelopeOpenIcon,
    ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { useCharacter } from './CharacterContext';
import { getMessages, markMessageAsRead, deleteMessage } from '../api';

const PlayerMessageTab = ({ onLogout }) => {
    const { selectedCharacterData: char, updateUnreadCount } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carica i messaggi quando cambia il PG o al montaggio
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

    const handleMarkAsRead = async (msg) => {
        if (msg.is_letto) return; // Non fare nulla se già letto

        // 1. Aggiornamento Ottimistico Locale (UI)
        const updatedMessages = messages.map(m => 
            m.id === msg.id ? { ...m, is_letto: true } : m
        );
        setMessages(updatedMessages);

        // 2. Aggiornamento Immediato del Badge nel Context
        // (Decrementa il contatore globale senza aspettare la fetch)
        updateUnreadCount(); 

        // 3. Chiamata API
        try {
            await markMessageAsRead(msg.id, char.id, onLogout);
        } catch (err) {
            console.error("Errore segna come letto:", err);
            // In caso di errore critico, potresti voler ricaricare la lista
            // loadMessages();
        }
    };

    const handleDelete = async (msgId, e) => {
        e.stopPropagation(); // Evita di aprire il messaggio (triggerare 'read') quando clicchi 'delete'

        if (!window.confirm("Sei sicuro di voler cancellare definitivamente questo messaggio?")) return;

        // Recuperiamo il messaggio prima di cancellarlo per controllare se era non-letto
        const msgToDelete = messages.find(m => m.id === msgId);
        
        // 1. Aggiornamento Ottimistico UI (Rimozione)
        const updatedMessages = messages.filter(m => m.id !== msgId);
        setMessages(updatedMessages);

        // 2. Se stiamo cancellando un messaggio non letto, aggiorniamo il badge
        if (msgToDelete && !msgToDelete.is_letto) {
            updateUnreadCount();
        }

        // 3. Chiamata API
        try {
            await deleteMessage(msgId, char.id, onLogout);
        } catch (err) {
            console.error("Errore cancellazione:", err);
            alert("Errore durante la cancellazione.");
            loadMessages(); // Ripristina la lista in caso di errore
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 animate-pulse">
                <EnvelopeIcon className="w-10 h-10 mb-2 opacity-50" />
                <p>Caricamento messaggi...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-red-400">
                <ExclamationCircleIcon className="w-10 h-10 mb-2" />
                <p>{error}</p>
                <button onClick={loadMessages} className="mt-4 underline hover:text-red-300">Riprova</button>
            </div>
        );
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                <EnvelopeOpenIcon className="w-12 h-12 mb-2 opacity-40" />
                <p className="italic">Nessun messaggio nella casella.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-20"> {/* pb-20 per evitare che l'ultimo messaggio finisca sotto la navbar mobile */}
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    onClick={() => handleMarkAsRead(msg)}
                    className={`
                        relative group p-4 rounded-xl border transition-all duration-200 cursor-pointer
                        ${msg.is_letto 
                            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' // Stile LETTO
                            : 'bg-gray-800 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-400' // Stile NON LETTO
                        }
                    `}
                >
                    <div className="flex gap-4">
                        {/* Colonna Icona */}
                        <div className={`shrink-0 mt-1 transition-colors duration-300 ${msg.is_letto ? 'text-gray-600' : 'text-indigo-400'}`}>
                            {msg.is_letto ? (
                                <EnvelopeOpenIcon className="w-6 h-6" />
                            ) : (
                                <div className="relative">
                                    <EnvelopeIcon className="w-6 h-6" />
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Colonna Contenuto */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`text-base font-bold truncate pr-8 ${msg.is_letto ? 'text-gray-400' : 'text-white'}`}>
                                    {msg.titolo}
                                </h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0 mt-0.5">
                                    {new Date(msg.data_invio).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                    <span className="hidden sm:inline"> • {new Date(msg.data_invio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-2.5 font-medium flex items-center">
                                Da: <span className={`ml-1 ${msg.is_letto ? 'text-gray-400' : 'text-indigo-200'}`}>{msg.mittente}</span>
                            </p>
                            
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed transition-colors ${msg.is_letto ? 'text-gray-500' : 'text-gray-300'}`}>
                                {msg.testo}
                            </p>
                        </div>
                    </div>

                    {/* Bottone Cancella (Posizionato assolutamente o in flex) */}
                    <button 
                        onClick={(e) => handleDelete(msg.id, e)}
                        className="
                            absolute bottom-4 right-4 sm:top-4 sm:bottom-auto p-2 rounded-lg
                            text-gray-600 hover:text-red-400 hover:bg-red-400/10 
                            transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                        "
                        title="Cancella messaggio"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default PlayerMessageTab;