import React, { useState, useEffect, useCallback } from 'react';
import { useCharacter } from './CharacterContext';
import { getMessages, markMessageAsRead, deleteMessage } from '../api';
import ComposeMessageModal from './ComposeMessageModal';

// Icone SVG semplici
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EnvelopeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
    </svg>
);

const PlayerMessageTab = ({ onLogout }) => {
    const { selectedCharacterId, fetchUserMessages } = useCharacter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [expandedMsgId, setExpandedMsgId] = useState(null);

    const loadMessages = useCallback(async () => {
        if (!selectedCharacterId) return;
        setLoading(true);
        try {
            const data = await getMessages(selectedCharacterId, onLogout);
            setMessages(data);
            // Aggiorna anche il contatore globale nel context
            fetchUserMessages(selectedCharacterId);
        } catch (error) {
            console.error("Errore caricamento messaggi", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCharacterId, onLogout, fetchUserMessages]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleRead = async (msgId, isAlreadyRead) => {
        // Espande/Collassa
        if (expandedMsgId === msgId) {
            setExpandedMsgId(null);
            return;
        }
        setExpandedMsgId(msgId);

        // Se non è letto, marcalo come letto API e aggiorna stato locale
        if (!isAlreadyRead) {
            try {
                await markMessageAsRead(msgId, selectedCharacterId, onLogout);
                setMessages(prev => prev.map(m => 
                    m.id === msgId ? { ...m, is_letto: true } : m
                ));
                fetchUserMessages(selectedCharacterId); // Aggiorna badge
            } catch (error) {
                console.error("Errore marcatura letto", error);
            }
        }
    };

    const handleDelete = async (e, msgId) => {
        e.stopPropagation(); // Evita l'apertura del messaggio
        if (!window.confirm("Sei sicuro di voler cancellare questo messaggio?")) return;

        try {
            await deleteMessage(msgId, selectedCharacterId, onLogout);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (error) {
            console.error("Errore cancellazione", error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header con Bottone Nuovo Messaggio */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Posta in Arrivo</h2>
                <button 
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-all flex items-center gap-2"
                >
                    <EnvelopeOpenIcon /> Scrivi
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-8">Caricamento messaggi...</div>
            ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 italic border border-dashed border-gray-700 rounded-lg">
                    Nessun messaggio ricevuto.
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg) => {
                        const isRead = msg.is_letto;
                        const isExpanded = expandedMsgId === msg.id;

                        return (
                            <div 
                                key={msg.id} 
                                onClick={() => handleRead(msg.id, isRead)}
                                className={`
                                    relative border rounded-lg p-4 cursor-pointer transition-all
                                    ${isRead ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-indigo-500/50 text-white shadow-md'}
                                    hover:bg-gray-750
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-2 mb-1">
                                            {!isRead && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                                            <h3 className={`font-bold text-base ${!isRead ? 'text-indigo-300' : ''}`}>
                                                {msg.titolo}
                                            </h3>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2">
                                            Da: <span className="text-gray-200">{msg.mittente}</span> &bull; {new Date(msg.data_invio).toLocaleString()}
                                        </div>
                                        
                                        {/* Anteprima o Testo Completo */}
                                        <div className={`text-sm ${isExpanded ? 'whitespace-pre-wrap mt-4 text-gray-100' : 'line-clamp-1 text-gray-400'}`}>
                                            {msg.testo}
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <button 
                                        onClick={(e) => handleDelete(e, msg.id)}
                                        className="text-gray-500 hover:text-red-400 p-2 rounded-full hover:bg-gray-600/50 transition-colors z-10"
                                        title="Cancella"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ComposeMessageModal 
                isOpen={isComposeOpen} 
                onClose={() => setIsComposeOpen(false)}
                currentCharacterId={selectedCharacterId}
                onMessageSent={loadMessages}
                onLogout={onLogout}
            />
        </div>
    );
};

export default PlayerMessageTab;