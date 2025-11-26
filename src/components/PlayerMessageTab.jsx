import React, { useState } from 'react';
import { useCharacter } from './CharacterContext';
import { Trash2, MailOpen, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import ComposeMessageModal from './ComposeMessageModal';

// Icone SVG semplici (o puoi usare lucide-react se preferisci coerenza)
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
    // --- 1. DELEGA: Prendiamo dati e funzioni dal Context ---
    const { 
        selectedCharacterId,
        userMessages,       // La lista messaggi centralizzata
        fetchUserMessages,  // Funzione per ricaricare (usata dopo l'invio)
        handleMarkAsRead,   // Azione centralizzata (aggiorna anche il badge)
        handleDeleteMessage,// Azione centralizzata
        isLoading           // Loading globale
    } = useCharacter();

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    // Stato locale solo per l'espansione UI, non per i dati
    const [expandedMsgId, setExpandedMsgId] = useState(null);

    const handleRead = (msgId, isAlreadyRead) => {
        // Gestione espansione locale
        if (expandedMsgId === msgId) {
            setExpandedMsgId(null);
            return;
        }
        setExpandedMsgId(msgId);

        // Se non letto, notifica il Context
        if (!isAlreadyRead) {
            handleMarkAsRead(msgId);
        }
    };

    // --- 2. RENDERING: Usiamo userMessages dal Context ---

    if (isLoading && (!userMessages || userMessages.length === 0)) {
        return <div className="p-4 text-center text-gray-400">Caricamento messaggi...</div>;
    }

    return (
        <div className="space-y-4 pb-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Mail className="text-indigo-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Posta in Arrivo</h2>
                </div>
                <button 
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-all flex items-center gap-2"
                >
                    <EnvelopeOpenIcon /> Scrivi
                </button>
            </div>

            {/* Lista Messaggi */}
            {!userMessages || userMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                    <MailOpen size={32} className="mb-2 opacity-20" />
                    <p>Nessun messaggio ricevuto.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {userMessages.map((msg) => {
                        // Nota: msg.letto arriva già corretto dal Context grazie alla modifica che abbiamo fatto prima
                        const isRead = msg.letto; 
                        const isExpanded = expandedMsgId === msg.id;
                        
                        // --- 3. CORREZIONE: Campo 'testo' e sicurezza ---
                        const testoSicuro = msg.testo || "";

                        return (
                            <div 
                                key={msg.id} 
                                onClick={() => handleRead(msg.id, isRead)}
                                className={`
                                    relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                                    ${isRead ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-700 border-indigo-500/50 text-white shadow-md'}
                                    hover:bg-gray-750
                                `}
                            >
                                {/* Indicatore Non Letto */}
                                {!isRead && (
                                    <div className="absolute top-0 right-0 w-0 h-0 border-t-20 border-l-20 border-t-indigo-500 border-l-transparent z-10 shadow-sm" />
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-8">
                                        {/* Titolo e Stato */}
                                        <div className="flex items-center gap-2 mb-1">
                                            {!isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                                            <h3 className={`font-bold text-base ${!isRead ? 'text-indigo-300' : ''}`}>
                                                {msg.titolo}
                                            </h3>
                                        </div>
                                        
                                        {/* Meta Info */}
                                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                                            <span>Da: <span className="text-gray-200 font-semibold">{msg.mittente}</span></span>
                                            <span>•</span>
                                            <span>{new Date(msg.data_invio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            {msg.tipo_messaggio === 'BROAD' && (
                                                <span className="text-indigo-400 font-bold uppercase text-[10px] border border-indigo-500/30 px-1 rounded">Broadcast</span>
                                            )}
                                        </div>
                                        
                                        {/* Contenuto Messaggio (HTML Sicuro + Troncamento) */}
                                        <div className={`text-sm prose prose-invert max-w-none ${isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                                            <div dangerouslySetInnerHTML={{ 
                                                __html: DOMPurify.sanitize(
                                                    isExpanded 
                                                        ? testoSicuro 
                                                        : testoSicuro.slice(0, 100) + (testoSicuro.length > 100 ? '...' : '')
                                                ) 
                                            }} />
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
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

            {/* Modale invio (delega il refresh al context) */}
            <ComposeMessageModal 
                isOpen={isComposeOpen} 
                onClose={() => setIsComposeOpen(false)}
                currentCharacterId={selectedCharacterId}
                onMessageSent={() => fetchUserMessages(selectedCharacterId)}
                onLogout={onLogout}
            />
        </div>
    );
};

export default PlayerMessageTab;