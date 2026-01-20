import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { searchPersonaggi, fetchAuthenticated } from '../api';
import RichTextEditor from './RichTextEditor'; // <-- Editor Rich Text

const ComposeMessageModal = ({ isOpen, onClose, currentCharacterId, onMessageSent, onLogout }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // Null = Staff se non si cerca
  const [titolo, setTitolo] = useState('');
  const [testo, setTesto] = useState(''); // Contiene HTML
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset campi alla chiusura
  useEffect(() => {
    if (!isOpen) {
        setQuery('');
        setResults([]);
        setSelectedRecipient(null);
        setTitolo('');
        setTesto('');
        setError('');
    }
  }, [isOpen]);

  // Gestione ricerca destinatario (opzionale se scrivi solo allo staff)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2 && !selectedRecipient) {
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
  }, [query, currentCharacterId, selectedRecipient]);

  const handleSelect = (pg) => {
    setSelectedRecipient(pg);
    setQuery(pg.nome);
    setResults([]);
  };

  const handleResetRecipient = () => {
      setSelectedRecipient(null);
      setQuery('');
      setResults([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Pulizia HTML base per evitare invio di stringhe vuote formattate (es <p><br></p>)
    const cleanText = testo.replace(/<[^>]+>/g, '').trim();
    if (!cleanText && !testo.includes('<img')) {
        setError("Il messaggio non può essere vuoto.");
        return;
    }

    setLoading(true);
    setError('');

    try {
        const payload = {
            destinatario_personaggio: selectedRecipient ? selectedRecipient.id : null, // Null = Staff
            titolo: titolo || 'Nuovo Messaggio',
            testo: testo, // HTML dal RichTextEditor
            tipo_messaggio: selectedRecipient ? 'IND' : 'STAFF'
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
          <Dialog.Title className="text-xl font-bold mb-4 flex justify-between items-center">
             <span>Nuovo Messaggio</span>
             <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
          </Dialog.Title>

          {error && <div className="bg-red-900 text-red-200 p-2 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSendMessage} className="space-y-4">
            
            {/* Destinatario (Opzionale: se vuoto = Staff) */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Destinatario <span className="text-xs text-gray-500">(Lascia vuoto per scrivere allo Staff)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Cerca personaggio..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={!!selectedRecipient}
                    />
                    {selectedRecipient && (
                        <button 
                            type="button" 
                            onClick={handleResetRecipient}
                            className="text-red-400 hover:text-red-300 px-2"
                        >
                            Cambia
                        </button>
                    )}
                </div>
                {/* Dropdown Risultati */}
                {results.length > 0 && !selectedRecipient && (
                    <ul className="absolute z-50 w-full bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-auto shadow-lg">
                        {results.map(pg => (
                            <li 
                                key={pg.id} 
                                onClick={() => handleSelect(pg)}
                                className="p-2 hover:bg-indigo-600 cursor-pointer text-sm border-b border-gray-600 last:border-0"
                            >
                                {pg.nome}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Oggetto</label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                maxLength={100}
                placeholder="Oggetto del messaggio"
              />
            </div>

            {/* Editor Rich Text */}
            <div className="h-64 sm:h-80">
                <RichTextEditor 
                    label="Testo Messaggio"
                    value={testo} 
                    onChange={setTesto} 
                    placeholder="Scrivi qui il tuo messaggio..."
                />
            </div>

            {/* Footer Bottoni */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
              >
                Annulla
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className={`px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-bold transition-colors text-sm flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Invio...' : 'Invia Messaggio'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default ComposeMessageModal;