import React, { useState, useEffect, Fragment } from 'react'; 
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { postBroadcastMessage, getAdminSentMessages } from '../api'; 

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminMessageTab = ({ onLogout }) => {
    const { selectedCharacterData } = useCharacter();
    
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [saveHistory, setSaveHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    const [history, setHistory] = useState([]); 
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        if (selectedCharacterData?.is_staff) {
            fetchHistory();
        }
    }, [selectedCharacterData]);

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

    if (!selectedCharacterData?.is_staff) {
        return <div className="p-4 text-red-400">Accesso negato.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !text) {
             alert('Titolo e contenuto sono obbligatori.');
             return;
        }
        
        setIsSending(true);
        try {
            const payload = {
                titolo: title, 
                testo: text,   
                salva_in_cronologia: saveHistory 
            };

            await postBroadcastMessage(payload, onLogout);
            alert('Messaggio Broadcast inviato con successo!');
            
            fetchHistory();
            
            setTitle('');
            setText('');
        } catch (err) {
            alert(`Errore nell'invio: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-2">
            <h2 className="text-xl font-bold mb-4 text-red-400">Gestione Messaggi Globali</h2>
            
            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-900 p-1 mb-4">
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button className={classNames('w-full rounded-lg py-2 text-sm font-medium', selected ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white')}>
                                Scrivi Messaggio
                            </button>
                        )}
                    </Tab>
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button 
                                onClick={fetchHistory} 
                                className={classNames('w-full rounded-lg py-2 text-sm font-medium', selected ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white')}
                            >
                                Cronologia Inviati
                            </button>
                        )}
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    {/* SUBTAB 1: FORM INVIO */}
                    <Tab.Panel>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Titolo</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Titolo Breve"
                                    className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Contenuto</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Contenuto del messaggio..."
                                    rows="5"
                                    className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={saveHistory}
                                    onChange={(e) => setSaveHistory(e.target.checked)}
                                    id="saveHistory"
                                    className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded"
                                />
                                <label htmlFor="saveHistory" className="ml-2 text-sm text-gray-300">Salva nella cronologia (visibile in questa lista)</label>
                            </div>
                            <button
                                type="submit"
                                disabled={isSending}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSending ? 'Invio in corso...' : 'INVIA BROADCAST'}
                            </button>
                        </form>
                    </Tab.Panel>

                    {/* SUBTAB 2: CRONOLOGIA REALE */}
                    <Tab.Panel>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {isLoadingHistory && <p className="text-center text-gray-400">Caricamento...</p>}
                            
                            {!isLoadingHistory && history.length > 0 ? (
                                history.map(msg => (
                                    <div key={msg.id} className="p-3 bg-gray-700 rounded border-l-4 border-gray-500">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-white">{msg.titolo}</p>
                                            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 ml-2 shrink-0">
                                                {msg.tipo_messaggio === 'BROAD' ? 'Broadcast' : msg.tipo_messaggio}
                                            </span>
                                        </div>
                                        
                                        {/* --- CORREZIONE: Rendering HTML --- */}
                                        <div 
                                            className="text-sm text-gray-300 mt-2 prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: msg.testo }}
                                        />
                                        {/* ---------------------------------- */}

                                        <p className="text-xs text-gray-500 mt-2 text-right border-t border-gray-600 pt-1">
                                            Inviato il: {new Date(msg.data_invio).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                !isLoadingHistory && (
                                    <p className="text-center text-gray-500 py-8">
                                        Nessun messaggio trovato nella cronologia inviati.
                                    </p>
                                )
                            )}
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default AdminMessageTab;