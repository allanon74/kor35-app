import React, { useState, useEffect, useRef } from 'react';
import { useCharacter } from './CharacterContext';
import { Trash2, Mail, MailOpen, Reply, Eye, EyeOff } from 'lucide-react';
import ComposeMessageModal from './ComposeMessageModal';
import RichTextDisplay from './RichTextDisplay';
import { fetchAuthenticated } from '../api';

const PlayerMessageTab = ({ onLogout }) => {
    const { 
        selectedCharacterData: char, 
        userMessages, 
        fetchUserMessages, 
        selectedCharacterId 
    } = useCharacter();

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [replyToRecipient, setReplyToRecipient] = useState(null); // Per pre-compilare destinatario
    const [expandedMessages, setExpandedMessages] = useState({}); // Gestione espansione
    const [optimisticReadStates, setOptimisticReadStates] = useState({}); // Optimistic UI per stato lettura
    const messagesEndRef = useRef(null);

    // Scroll automatico in basso all'apertura
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [userMessages]);

    const toggleMessageExpansion = (msgId) => {
        setExpandedMessages(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }));
    };

    const handleDeleteMessage = async (msgId) => {
        if (!confirm('Vuoi davvero cancellare questo messaggio?')) return;
        try {
            await fetchAuthenticated(`/personaggi/api/messaggi/${msgId}/cancella/`, {
                method: 'POST',
                body: JSON.stringify({ personaggio_id: selectedCharacterId })
            }, onLogout);
            fetchUserMessages(selectedCharacterId);
        } catch (error) {
            console.error('Errore cancellazione:', error);
        }
    };

    const handleToggleRead = async (msgId, currentStatus) => {
        // Optimistic update
        setOptimisticReadStates(prev => ({ ...prev, [msgId]: !currentStatus }));
        
        try {
            await fetchAuthenticated(`/personaggi/api/messaggi/${msgId}/toggle_letto/`, {
                method: 'POST',
                body: JSON.stringify({ personaggio_id: selectedCharacterId })
            }, onLogout);
            // Ricarica per avere lo stato definitivo dal server
            fetchUserMessages(selectedCharacterId);
        } catch (error) {
            console.error('Errore cambio stato lettura:', error);
            // Ripristina lo stato precedente in caso di errore
            setOptimisticReadStates(prev => {
                const newState = { ...prev };
                delete newState[msgId];
                return newState;
            });
        }
    };

    const handleReply = (msg) => {
        console.log('Reply to message:', msg); // Debug
        
        // Se il messaggio è dallo staff, rispondi allo staff
        if (msg.mittente_is_staff) {
            setReplyToRecipient({ isStaff: true });
        } else if (msg.mittente_personaggio_id) {
            // Altrimenti rispondi al mittente (usa mittente_personaggio_id dal serializer)
            setReplyToRecipient({ 
                id: msg.mittente_personaggio_id, 
                nome: msg.mittente_nome,
                isStaff: false 
            });
        } else {
            console.error('Impossibile rispondere: mittente non valido', msg);
            alert('Impossibile rispondere a questo messaggio');
            return;
        }
        setIsComposeOpen(true);
    };

    if (!char) return <div className="text-gray-400 text-center mt-4">Seleziona un personaggio</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] relative">
            
            {/* --- LISTA MESSAGGI --- */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar mb-16">
                {userMessages && userMessages.length > 0 ? (
                    userMessages.map((msg) => {
                        const isStaff = msg.mittente_is_staff;
                        const isExpanded = expandedMessages[msg.id];
                        // Usa lo stato ottimistico se presente, altrimenti lo stato dal server
                        const isRead = optimisticReadStates[msg.id] !== undefined 
                            ? optimisticReadStates[msg.id] 
                            : msg.letto;

                        return (
                            <div 
                                key={msg.id} 
                                className={`flex w-full ${isStaff ? 'justify-start' : 'justify-end'}`}
                            >
                                <div 
                                    className={`
                                        relative max-w-[90%] sm:max-w-[80%] rounded-xl p-3 shadow-md transition-all duration-200
                                        ${isStaff 
                                            ? `${isRead ? 'bg-gray-800 opacity-80' : 'bg-gray-700'} text-gray-100 rounded-tl-none border-l-4 border-red-500 hover:bg-gray-600` 
                                            : `${isRead ? 'bg-indigo-950 opacity-80' : 'bg-indigo-900'} text-white rounded-tr-none border-r-4 border-indigo-400 hover:bg-indigo-800`
                                        }
                                    `}
                                >
                                    {/* Header Messaggio */}
                                    <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-1 gap-4">
                                        <div className="flex items-center gap-2">
                                            {isRead ? <MailOpen size={14} className="opacity-50"/> : <Mail size={14} className="text-yellow-400 animate-pulse"/>}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isStaff ? 'text-red-300' : 'text-indigo-200'}`}>
                                                {msg.mittente_nome || 'Sistema'}
                                            </span>
                                            {!isRead && (
                                                <span className="text-[9px] bg-yellow-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                    Nuovo
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.data_creazione || msg.data_invio).toLocaleString()}
                                            </span>
                                            
                                            {/* Pulsante Rispondi */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                                                className="text-gray-400 hover:text-green-400 transition-colors p-0.5 rounded"
                                                title="Rispondi"
                                            >
                                                <Reply size={14} />
                                            </button>
                                            
                                            {/* Pulsante Segna come letto/non letto */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleRead(msg.id, isRead); }}
                                                className={`transition-colors p-0.5 rounded ${isRead ? 'text-gray-500 hover:text-blue-400' : 'text-blue-400 hover:text-blue-300'}`}
                                                title={isRead ? 'Segna come non letto' : 'Segna come letto'}
                                            >
                                                {isRead ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            
                                            {/* Pulsante Elimina */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                                className="text-gray-400 hover:text-red-400 transition-colors p-0.5 rounded"
                                                title="Cancella"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Titolo */}
                                    {msg.titolo && (
                                        <div 
                                            className="font-bold text-sm mb-1 cursor-pointer"
                                            onClick={() => toggleMessageExpansion(msg.id)}
                                        >
                                            {msg.titolo}
                                        </div>
                                    )}

                                    {/* Contenuto Rich Text con Logica "Leggi tutto" via CSS */}
                                    <div 
                                        className={`text-sm prose prose-invert max-w-none wrap-break-words relative transition-all duration-300 cursor-pointer ${!isExpanded ? 'max-h-24 overflow-hidden' : ''}`}
                                        onClick={() => toggleMessageExpansion(msg.id)}
                                    >
                                        <RichTextDisplay content={msg.testo} />
                                        
                                        {/* Sfumatura se non espanso */}
                                        {!isExpanded && (
                                            <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-gray-700/90 to-transparent pointer-events-none" />
                                        )}
                                    </div>
                                    
                                    {!isExpanded && (
                                        <div className="text-xs text-center text-gray-400 mt-1 italic">
                                            Clicca per espandere
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                         <p>Nessun messaggio.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- FAB / BUTTON PER NUOVO MESSAGGIO --- */}
            <div className="absolute bottom-4 right-4 z-10">
                <button
                    onClick={() => {
                        setReplyToRecipient(null);
                        setIsComposeOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <Mail size={24} />
                    <span className="font-bold hidden sm:inline">Nuovo Messaggio</span>
                </button>
            </div>

            {/* --- MODALE COMPOSIZIONE --- */}
            <ComposeMessageModal 
                isOpen={isComposeOpen} 
                onClose={() => {
                    setIsComposeOpen(false);
                    setReplyToRecipient(null);
                }}
                currentCharacterId={selectedCharacterId}
                replyToRecipient={replyToRecipient}
                onMessageSent={() => {
                    fetchUserMessages(selectedCharacterId);
                }}
                onLogout={onLogout}
            />
        </div>
    );
};

export default PlayerMessageTab;