import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { searchPersonaggi, fetchAuthenticated } from '../api';
import RichTextEditor from './RichTextEditor';
import { Shield, User, X } from 'lucide-react';

const ComposeMessageModal = ({ isOpen, onClose, currentCharacterId, onMessageSent, onLogout, replyToRecipient }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  
  // NUOVO: Toggle per invio staff
  const [isStaffMessage, setIsStaffMessage] = useState(false);
  
  const [titolo, setTitolo] = useState('');
  const [testo, setTesto] = useState(''); // HTML content
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 

  // Reset stato all'apertura
  useEffect(() => {
    if (isOpen) {
        setQuery('');
        setResults([]);
        setTitolo('');
        setTesto('');
        setError('');
        
        // Se c'è un destinatario pre-impostato (risposta)
        if (replyToRecipient) {
            if (replyToRecipient.isStaff) {
                setIsStaffMessage(true);
                setSelectedRecipient(null);
            } else {
                setIsStaffMessage(false);
                setSelectedRecipient(replyToRecipient);
                setQuery(replyToRecipient.nome || '');
            }
        } else {
            setSelectedRecipient(null);
            setIsStaffMessage(false);
        }
    }
  }, [isOpen, replyToRecipient]);

  // Logica di ricerca (Disabilitata se è messaggio staff)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!isStaffMessage && query.length >= 2 && !selectedRecipient) {
        try {
          const data = await searchPersonaggi(query, currentCharacterId);
          setResults(data);
        } catch (err) {
          console.error("Errore ricerca", err);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentCharacterId, selectedRecipient, isStaffMessage]);

  const handleSelect = (pg) => {
    setSelectedRecipient(pg);
    setQuery(pg.nome);
    setResults([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Validazione
    if (!isStaffMessage && !selectedRecipient) {
        setError("Devi selezionare un destinatario o spuntare 'Scrivi allo Staff'.");
        return;
    }

    // Pulizia HTML vuoto
    const cleanText = testo.replace(/<[^>]+>/g, '').trim();
    if (!cleanText && !testo.includes('<img')) {
        setError("Il messaggio non può essere vuoto.");
        return;
    }

    setLoading(true);
    setError('');

    try {
        const payload = {
            // Se Staff Message è true, destinatario è NULL
            destinatario_personaggio: isStaffMessage ? null : selectedRecipient.id,
            titolo: titolo,
            testo: testo,
            is_staff_message: isStaffMessage // Flag per il backend
        };

        await fetchAuthenticated('/personaggi/api/messaggi/', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, onLogout);

        if (onMessageSent) onMessageSent();
        onClose();
    } catch (err) {
        setError('Errore invio: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-80" />

        <div className="relative bg-gray-800 text-white rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-gray-600">
          <div className="flex justify-between items-center mb-4">
             <Dialog.Title className="text-xl font-bold">Nuovo Messaggio</Dialog.Title>
             <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
          </div>

          {error && <div className="bg-red-900 text-red-200 p-2 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSendMessage} className="space-y-4">
            
            {/* OPZIONE STAFF */}
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                <input 
                    type="checkbox" 
                    id="chk_staff"
                    checked={isStaffMessage}
                    onChange={(e) => {
                        setIsStaffMessage(e.target.checked);
                        if(e.target.checked) {
                            setSelectedRecipient(null);
                            setQuery('');
                        }
                    }}
                    disabled={replyToRecipient?.isStaff} // Disabilita se stiamo rispondendo allo staff
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="chk_staff" className="cursor-pointer flex items-center gap-2 font-bold text-indigo-300">
                    <Shield size={18} />
                    Invia messaggio allo Staff
                </label>
            </div>

            {/* RICERCA DESTINATARIO (Nascosta se Staff è attivo) */}
            {!isStaffMessage && (
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Destinatario</label>
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 pl-9 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Cerca personaggio..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={!!selectedRecipient}
                            />
                            <User size={16} className="absolute left-3 top-3 text-gray-500"/>
                        </div>
                        
                        {selectedRecipient && !replyToRecipient && (
                            <button 
                                type="button" 
                                onClick={() => { setSelectedRecipient(null); setQuery(''); }}
                                className="text-red-400 hover:text-red-300 px-3 border border-red-900/50 rounded bg-red-900/10"
                            >
                                Cambia
                            </button>
                        )}
                    </div>
                    
                    {/* Lista Risultati */}
                    {results.length > 0 && !selectedRecipient && (
                        <ul className="absolute z-50 w-full bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-auto shadow-lg">
                            {results.map(pg => (
                                <li 
                                    key={pg.id} 
                                    onClick={() => handleSelect(pg)}
                                    className="p-2 hover:bg-indigo-600 cursor-pointer text-sm border-b border-gray-600 flex justify-between"
                                >
                                    <span>{pg.nome}</span>
                                    {pg.user_username && <span className="text-gray-400 text-xs">@{pg.user_username}</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Oggetto</label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            {/* Editor */}
            <div className="h-64 sm:h-80 text-black rounded overflow-hidden">
                <RichTextEditor 
                    label="Testo"
                    value={testo} 
                    onChange={setTesto} 
                    placeholder="Scrivi qui..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors">Annulla</button>
              <button 
                type="submit" 
                disabled={loading}
                className={`px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'Invio...' : 'Invia'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default ComposeMessageModal;