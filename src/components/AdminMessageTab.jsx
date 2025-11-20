import React, { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react'; // Per le sub-tab
import { useCharacter } from './CharacterContext';
import { postBroadcastMessage } from '../api'; 

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminMessageTab = ({ onLogout }) => {
    const { selectedCharacterData } = useCharacter();
    
    // Stati per il form
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [saveHistory, setSaveHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    // Dati finti per la cronologia (in attesa dell'API dedicata)
    const [history, setHistory] = useState([]); 

    // Controllo permessi corretto
    if (!selectedCharacterData?.is_staff) {
        return <div className="p-4 text-red-400">Accesso negato.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !text) return;
        
        setIsSending(true);
        try {
            await postBroadcastMessage({ title, text, save_in_cronologia: saveHistory }, onLogout);
            alert('Messaggio Broadcast inviato!');
            // Aggiungi alla cronologia locale (simulazione feedback immediato)
            setHistory([{ id: Date.now(), title, testo: text, data_invio: new Date().toISOString() }, ...history]);
            setTitle('');
            setText('');
        } catch (err) {
            alert(`Errore: ${err.message}`);
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
                            <button className={classNames('w-full rounded-lg py-2 text-sm font-medium', selected ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white')}>
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
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-500 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Contenuto</label>
                                <textarea value={text} onChange={(e) => setText(e.target.value)} rows="5"
                                    className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-500 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" checked={saveHistory} onChange={(e) => setSaveHistory(e.target.checked)}
                                    id="saveHistory" className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded" />
                                <label htmlFor="saveHistory" className="ml-2 text-sm text-gray-300">Salva nella cronologia pubblica</label>
                            </div>
                            <button type="submit" disabled={isSending}
                                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                                {isSending ? 'Invio in corso...' : 'INVIA BROADCAST'}
                            </button>
                        </form>
                    </Tab.Panel>

                    {/* SUBTAB 2: CRONOLOGIA (Placeholder) */}
                    <Tab.Panel>
                        <div className="space-y-2">
                            {history.length > 0 ? (
                                history.map(msg => (
                                    <div key={msg.id} className="p-3 bg-gray-700 rounded border-l-4 border-gray-500">
                                        <p className="font-bold text-white">{msg.title}</p>
                                        <p className="text-sm text-gray-300 mt-1">{msg.testo}</p>
                                        <p className="text-xs text-gray-500 mt-2 text-right">
                                            Inviato il: {new Date(msg.data_invio).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    Nessun messaggio inviato in questa sessione.
                                    <br/><span className="text-xs">(La cronologia persistente richiede un endpoint API dedicato)</span>
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