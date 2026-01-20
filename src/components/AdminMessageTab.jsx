import React, { useState, useEffect, Fragment } from 'react'; 
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { 
    postBroadcastMessage, 
    getAdminSentMessages, 
    fetchStaffMessages, 
    fetchAuthenticated, 
    searchPersonaggi // Assicurati che questa sia in api.js, altrimenti rimuovi la ricerca singolo
} from '../api'; 
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';
import { Mail, Users, Radio, Clock, Shield, CheckCircle, Trash2, Search, X } from 'lucide-react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminMessageTab = ({ onLogout }) => {
    const { selectedCharacterData } = useCharacter();
    
    // --- STATI TAB 1: INBOX (Posta in arrivo) ---
    const [inboxMessages, setInboxMessages] = useState([]);
    const [isLoadingInbox, setIsLoadingInbox] = useState(false);

    // --- STATI TAB 2: COMPOSE (Invio) ---
    const [targetType, setTargetType] = useState('broadcast'); // 'broadcast', 'group', 'single'
    const [selectedGroup, setSelectedGroup] = useState('tutti');
    const [singleRecipient, setSingleRecipient] = useState(null); // Per invio singolo
    const [searchQuery, setSearchQuery] = useState(''); // Per ricerca pg
    const [searchResults, setSearchResults] = useState([]);
    
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [saveHistory, setSaveHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    // --- STATI TAB 3: HISTORY (Cronologia) ---
    const [history, setHistory] = useState([]); 
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if (selectedCharacterData?.is_staff) {
            fetchInbox();
            fetchHistory();
        }
    }, [selectedCharacterData]);

    // 1. Fetch Posta in Arrivo (Messaggi per Staff)
    const fetchInbox = async () => {
        setIsLoadingInbox(true);
        try {
            const data = await fetchStaffMessages(onLogout);
            setInboxMessages(data || []);
        } catch (err) {
            console.error("Errore inbox staff:", err);
        } finally {
            setIsLoadingInbox(false);
        }
    };

    // 2. Fetch Cronologia
    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await getAdminSentMessages(onLogout);
            setHistory(data || []);
        } catch (err) {
            console.error("Errore caricamento cronologia admin:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // --- GESTIONE RICERCA SINGOLO GIOCATORE (Tab 2) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (targetType === 'single' && searchQuery.length >= 2 && !singleRecipient) {
                try {
                    const results = await searchPersonaggi(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Errore ricerca:", error);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, targetType, singleRecipient]);

    // --- GESTIONE INVIO MESSAGGIO (Tab 2) ---
    const handleSend = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', msg: '' });

        if (!title.trim() || !text.trim()) {
            setFeedback({ type: 'error', msg: 'Titolo e testo sono obbligatori.' });
            return;
        }

        if (targetType === 'single' && !singleRecipient) {
            setFeedback({ type: 'error', msg: 'Seleziona un destinatario singolo.' });
            return;
        }

        setIsSending(true);

        try {
            if (targetType === 'single') {
                // Invio Singolo (Usa endpoint standard messaggi)
                await fetchAuthenticated('/personaggi/api/messaggi/', {
                    method: 'POST',
                    body: JSON.stringify({
                        destinatario_personaggio: singleRecipient.id,
                        titolo: title,
                        testo: text,
                        tipo_messaggio: 'STAFF', // Messaggio ufficiale
                        mittente_is_staff: true // Flag opzionale se gestito da backend
                    })
                }, onLogout);
            } else {
                // Invio Broadcast o Gruppo (Usa tua API esistente)
                const payload = {
                    titolo: title,
                    testo: text, // HTML content from RichTextEditor
                    target_type: targetType,
                    target_group: targetType === 'group' ? selectedGroup : null,
                    save_history: saveHistory
                };
                await postBroadcastMessage(payload, onLogout);
            }

            setFeedback({ type: 'success', msg: 'Messaggio inviato con successo!' });
            setTitle('');
            setText('');
            setSingleRecipient(null);
            setSearchQuery('');
            fetchHistory(); // Aggiorna cronologia
        } catch (err) {
            setFeedback({ type: 'error', msg: 'Errore invio: ' + err.message });
        } finally {
            setIsSending(false);
        }
    };

    if (!selectedCharacterData?.is_staff) {
        return <div className="p-4 text-red-400 font-bold text-center">Accesso Negato. Area riservata allo Staff.</div>;
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg shadow-xl overflow-hidden">
            <Tab.Group>
                <div className="bg-gray-800 p-2 border-b border-gray-700">
                    <Tab.List className="flex space-x-2 rounded-xl bg-gray-900/50 p-1">
                        
                        {/* TAB 1: INBOX */}
                        <Tab as={Fragment}>
                            {({ selected }) => (
                                <button className={classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all flex items-center justify-center gap-2',
                                    selected ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )}>
                                    <Mail size={18} />
                                    <span>Posta Staff</span>
                                    {inboxMessages.some(m => !m.letto) && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full animate-pulse">
                                            {inboxMessages.filter(m => !m.letto).length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </Tab>

                        {/* TAB 2: COMPOSE */}
                        <Tab as={Fragment}>
                            {({ selected }) => (
                                <button className={classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all flex items-center justify-center gap-2',
                                    selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )}>
                                    <Radio size={18} />
                                    <span>Nuovo Messaggio</span>
                                </button>
                            )}
                        </Tab>

                        {/* TAB 3: HISTORY */}
                        <Tab as={Fragment}>
                            {({ selected }) => (
                                <button className={classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all flex items-center justify-center gap-2',
                                    selected ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )}>
                                    <Clock size={18} />
                                    <span>Cronologia</span>
                                </button>
                            )}
                        </Tab>
                    </Tab.List>
                </div>

                <Tab.Panels className="flex-1 overflow-hidden relative">
                    
                    {/* --- PANEL 1: INBOX --- */}
                    <Tab.Panel className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-green-400 font-bold uppercase text-xs flex items-center gap-2">
                                <Shield size={14}/> Messaggi ricevuti come Staff
                            </h3>
                            <button onClick={fetchInbox} className="text-xs text-gray-400 hover:text-white underline">Aggiorna</button>
                        </div>

                        {isLoadingInbox ? (
                            <p className="text-center text-gray-500">Caricamento...</p>
                        ) : inboxMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-gray-700 border-dashed rounded-lg">
                                <CheckCircle size={32} className="mb-2 opacity-50"/>
                                <p>Nessun messaggio da leggere.</p>
                            </div>
                        ) : (
                            inboxMessages.map(msg => (
                                <div key={msg.id} className={`bg-gray-800 border-l-4 ${msg.letto ? 'border-gray-600' : 'border-green-500'} rounded-lg p-4 shadow-lg transition-all hover:bg-gray-750`}>
                                    <div className="flex justify-between items-start mb-2 border-b border-gray-700 pb-2">
                                        <div>
                                            <span className="font-bold text-green-300 block">
                                                Da: {msg.mittente_nome || 'Utente / Sistema'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(msg.data_creazione).toLocaleString()}
                                            </span>
                                        </div>
                                        {!msg.letto && <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">NUOVO</span>}
                                    </div>
                                    <h4 className="font-bold text-white mb-2">{msg.titolo}</h4>
                                    
                                    <div className="bg-gray-900/50 p-3 rounded text-sm text-gray-300">
                                        <RichTextDisplay content={msg.testo} />
                                    </div>
                                </div>
                            ))
                        )}
                    </Tab.Panel>

                    {/* --- PANEL 2: COMPOSE --- */}
                    <Tab.Panel className="h-full overflow-y-auto custom-scrollbar p-4">
                        <form onSubmit={handleSend} className="max-w-3xl mx-auto space-y-4">
                            
                            {/* TARGET SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
                                <label className={`flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition-colors ${targetType === 'broadcast' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                                    <input type="radio" name="target" value="broadcast" checked={targetType === 'broadcast'} onChange={() => setTargetType('broadcast')} className="hidden" />
                                    <Radio size={16} /> Broadcast (Tutti)
                                </label>
                                <label className={`flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition-colors ${targetType === 'group' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                                    <input type="radio" name="target" value="group" checked={targetType === 'group'} onChange={() => setTargetType('group')} className="hidden" />
                                    <Users size={16} /> Gruppo
                                </label>
                                <label className={`flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition-colors ${targetType === 'single' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                                    <input type="radio" name="target" value="single" checked={targetType === 'single'} onChange={() => setTargetType('single')} className="hidden" />
                                    <Mail size={16} /> Singolo
                                </label>
                            </div>

                            {/* SELECTOR LOGIC */}
                            <div className="animate-fadeIn">
                                {targetType === 'group' && (
                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <label className="block text-sm font-bold text-gray-400 mb-1">Seleziona Gruppo</label>
                                        <select 
                                            value={selectedGroup} 
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="tutti">Tutti i Personaggi</option>
                                            <option value="staff">Solo Staff</option>
                                            <option value="master">Solo Master</option>
                                            <option value="png">Solo PNG</option>
                                            <option value="pg">Solo PG Giocanti</option>
                                        </select>
                                    </div>
                                )}

                                {targetType === 'single' && (
                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 relative">
                                        <label className="block text-sm font-bold text-gray-400 mb-1">Cerca Personaggio</label>
                                        <div className="flex gap-2">
                                            <div className="relative w-full">
                                                <input 
                                                    type="text" 
                                                    placeholder="Inizia a scrivere il nome..."
                                                    value={query}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 pl-9 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    disabled={!!singleRecipient}
                                                />
                                                <Search size={16} className="absolute left-3 top-3 text-gray-500"/>
                                            </div>
                                            {singleRecipient && (
                                                <button 
                                                    type="button"
                                                    onClick={() => { setSingleRecipient(null); setSearchQuery(''); }}
                                                    className="bg-red-900/50 hover:bg-red-900 text-red-200 px-3 rounded border border-red-800"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Risultati Ricerca */}
                                        {searchResults.length > 0 && !singleRecipient && (
                                            <ul className="absolute z-10 w-full left-0 bg-gray-700 border border-gray-600 mt-1 rounded shadow-xl max-h-40 overflow-y-auto">
                                                {searchResults.map(pg => (
                                                    <li 
                                                        key={pg.id} 
                                                        onClick={() => { setSingleRecipient(pg); setSearchQuery(pg.nome); setSearchResults([]); }}
                                                        className="p-2 hover:bg-indigo-600 cursor-pointer text-sm border-b border-gray-600"
                                                    >
                                                        {pg.nome}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* FIELDS */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Oggetto del messaggio"
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                                <RichTextEditor 
                                    value={text} 
                                    onChange={setText} 
                                    placeholder="Scrivi il contenuto..."
                                />
                            </div>

                            {/* OPTIONS & SUBMIT */}
                            <div className="flex justify-between items-center pt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={saveHistory} 
                                        onChange={(e) => setSaveHistory(e.target.checked)}
                                        className="rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    Salva in cronologia
                                </label>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className={`px-6 py-2 rounded font-bold text-white transition-all shadow-lg ${isSending ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:translate-y-px'}`}
                                >
                                    {isSending ? 'Invio in corso...' : 'Invia Messaggio'}
                                </button>
                            </div>

                            {feedback.msg && (
                                <div className={`p-3 rounded text-center text-sm ${feedback.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
                                    {feedback.msg}
                                </div>
                            )}
                        </form>
                    </Tab.Panel>

                    {/* --- PANEL 3: HISTORY --- */}
                    <Tab.Panel className="h-full overflow-y-auto custom-scrollbar p-2">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-gray-400 font-bold uppercase text-xs">Messaggi Inviati</h3>
                            <button onClick={fetchHistory} className="text-xs text-indigo-400 hover:text-white">Aggiorna</button>
                        </div>

                        <div className="space-y-4">
                            {isLoadingHistory ? (
                                <p className="text-center text-gray-500">Caricamento...</p>
                            ) : history.length > 0 ? (
                                history.map((msg) => (
                                    <div key={msg.id} className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-indigo-300">{msg.titolo}</h4>
                                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                                {msg.tipo_target || 'Broadcast'}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-300 mt-2">
                                            <RichTextDisplay content={msg.testo} />
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2 text-right border-t border-gray-700 pt-1">
                                            Inviato il: {new Date(msg.data_invio || msg.data_creazione).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    Nessun messaggio trovato nella cronologia.
                                </p>
                            )}
                        </div>
                    </Tab.Panel>

                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default AdminMessageTab;