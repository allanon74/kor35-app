import React, { useState, useEffect, useRef } from 'react';
import { useCharacter } from './CharacterContext';
import { Trash2, Mail, MailOpen, MessageCircle, List, Reply } from 'lucide-react';
import ComposeMessageModal from './ComposeMessageModal';
import RichTextDisplay from './RichTextDisplay';
import ConversazioneView from './ConversazioneView';
import { fetchAuthenticated, getConversazioni, rispondiMessaggio } from '../api';

const PlayerMessageTab = ({ onLogout }) => {
    const { 
        selectedCharacterData: char, 
        userMessages, 
        fetchUserMessages, 
        selectedCharacterId 
    } = useCharacter();

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState({}); // Gestione espansione
    const [viewMode, setViewMode] = useState('list'); // 'list' o 'conversations'
    const [conversazioni, setConversazioni] = useState([]);
    const [selectedConversazione, setSelectedConversazione] = useState(null);
    const [isLoadingConv, setIsLoadingConv] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll automatico in basso all'apertura
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [userMessages]);

    // Carica conversazioni quando si passa alla vista conversazioni
    useEffect(() => {
        if (viewMode === 'conversations' && selectedCharacterId) {
            loadConversazioni();
        }
    }, [viewMode, selectedCharacterId]);

    const loadConversazioni = async () => {
        setIsLoadingConv(true);
        try {
            const data = await getConversazioni(selectedCharacterId, onLogout);
            setConversazioni(data);
        } catch (error) {
            console.error('Errore caricamento conversazioni:', error);
        } finally {
            setIsLoadingConv(false);
        }
    };

    const handleRispondi = async (messaggioId, testo) => {
        try {
            await rispondiMessaggio(messaggioId, selectedCharacterId, testo, '', onLogout);
            // Ricarica conversazioni
            await loadConversazioni();
            // Ricarica anche la lista messaggi
            fetchUserMessages(selectedCharacterId);
        } catch (error) {
            console.error('Errore risposta:', error);
            throw error;
        }
    };

    const toggleMessageExpansion = (msgId) => {
        setExpandedMessages(prev => ({
            ...prev,
            [msgId]: !prev[msgId]
        }));
    };

    const handleDeleteMessage = async (msgId) => {
        if (!confirm('Vuoi davvero cancellare questo messaggio?')) return;
        try {
            await fetchAuthenticated(`/personaggi/api/messaggi/${msgId}/`, {
                method: 'DELETE'
            }, onLogout);
            fetchUserMessages(selectedCharacterId);
        } catch (error) {
            console.error('Errore cancellazione:', error);
        }
    };

    if (!char) return <div className="text-gray-400 text-center mt-4">Seleziona un personaggio</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] relative">
            
            {/* Toggle View Mode */}
            <div className="flex gap-2 p-2 bg-gray-800 rounded-lg mb-4">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                        viewMode === 'list' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                    <List className="w-4 h-4" />
                    Lista
                </button>
                <button
                    onClick={() => setViewMode('conversations')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                        viewMode === 'conversations' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Conversazioni
                </button>
            </div>
            
            {/* --- VISTA LISTA MESSAGGI --- */}
            {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar mb-16">
                {userMessages && userMessages.length > 0 ? (
                    userMessages.map((msg) => {
                        const isStaff = msg.mittente_is_staff;
                        const isExpanded = expandedMessages[msg.id];

                        return (
                            <div 
                                key={msg.id} 
                                className={`flex w-full ${isStaff ? 'justify-start' : 'justify-end'}`}
                            >
                                <div 
                                    onClick={() => toggleMessageExpansion(msg.id)}
                                    className={`
                                        relative max-w-[90%] sm:max-w-[80%] rounded-xl p-3 shadow-md cursor-pointer transition-all duration-200
                                        ${isStaff 
                                            ? 'bg-gray-700 text-gray-100 rounded-tl-none border-l-4 border-red-500 hover:bg-gray-600' 
                                            : 'bg-indigo-900 text-white rounded-tr-none border-r-4 border-indigo-400 hover:bg-indigo-800'
                                        }
                                    `}
                                >
                                    {/* Header Messaggio */}
                                    <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-1 gap-4">
                                        <div className="flex items-center gap-2">
                                            {msg.letto ? <MailOpen size={14} className="opacity-50"/> : <Mail size={14} className="text-yellow-400"/>}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isStaff ? 'text-red-300' : 'text-indigo-200'}`}>
                                                {msg.mittente_nome || 'Sistema'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.data_creazione).toLocaleString()}
                                            </span>
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
                                        <div className="font-bold text-sm mb-1">{msg.titolo}</div>
                                    )}

                                    {/* Contenuto Rich Text con Logica "Leggi tutto" via CSS */}
                                    <div className={`text-sm prose prose-invert max-w-none wrap-break-words relative transition-all duration-300 ${!isExpanded ? 'max-h-24 overflow-hidden' : ''}`}>
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
            )}

            {/* --- VISTA CONVERSAZIONI --- */}
            {viewMode === 'conversations' && (
                <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar mb-16">
                    {isLoadingConv ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-gray-400">Caricamento conversazioni...</div>
                        </div>
                    ) : conversazioni.length > 0 ? (
                        conversazioni.map((conv) => (
                            <div
                                key={conv.conversazione_id}
                                onClick={() => setSelectedConversazione(conv)}
                                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 hover:border-indigo-500"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                                        <div>
                                            <div className="font-bold text-white text-sm">
                                                {conv.partecipanti.map(p => p.nome).join(' • ')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {conv.messaggi.length} {conv.messaggi.length === 1 ? 'messaggio' : 'messaggi'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(conv.ultimo_messaggio).toLocaleString()}
                                        </span>
                                        {conv.non_letti > 0 && (
                                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {conv.non_letti}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 line-clamp-2">
                                    {conv.messaggi[conv.messaggi.length - 1]?.titolo || 'Nessun titolo'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                            <MessageCircle className="w-16 h-16 mb-2" />
                            <p>Nessuna conversazione attiva.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- FAB / BUTTON PER NUOVO MESSAGGIO --- */}
            <div className="absolute bottom-4 right-4 z-10">
                <button
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <Mail size={24} />
                    <span className="font-bold hidden sm:inline">Scrivi Staff</span>
                </button>
            </div>

            {/* --- MODALE COMPOSIZIONE --- */}
            <ComposeMessageModal 
                isOpen={isComposeOpen} 
                onClose={() => setIsComposeOpen(false)}
                currentCharacterId={selectedCharacterId}
                onMessageSent={() => {
                    fetchUserMessages(selectedCharacterId);
                    if (viewMode === 'conversations') {
                        loadConversazioni();
                    }
                }}
                onLogout={onLogout}
            />

            {/* --- MODALE CONVERSAZIONE --- */}
            {selectedConversazione && (
                <ConversazioneView
                    conversazione={selectedConversazione}
                    onRispondi={handleRispondi}
                    onClose={() => setSelectedConversazione(null)}
                    currentPersonaggioId={selectedCharacterId}
                />
            )}
        </div>
    );
};

export default PlayerMessageTab;