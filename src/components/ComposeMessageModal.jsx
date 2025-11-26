import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { searchPersonaggi, sendPrivateMessage } from '../api';

const ComposeMessageModal = ({ isOpen, onClose, currentCharacterId, onMessageSent, onLogout }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [titolo, setTitolo] = useState('');
  const [testo, setTesto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gestione ricerca debounce
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecipient || !titolo || !testo) {
        setError("Tutti i campi sono obbligatori.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPrivateMessage({
        destinatario_id: selectedRecipient.id,
        titolo: titolo,
        testo: testo
      }, onLogout);
      
      // Reset form
      setTitolo('');
      setTesto('');
      handleResetRecipient();
      onMessageSent(); // Callback per aggiornare lista o chiudere
      onClose();
    } catch (err) {
      setError("Errore nell'invio del messaggio: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-xl bg-gray-800 border border-gray-700 p-6 text-white shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4 text-indigo-400">Scrivi Messaggio</Dialog.Title>

          {error && <div className="mb-4 p-2 bg-red-900/50 border border-red-500 rounded text-sm text-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Destinatario con Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-400 mb-1">A chi vuoi scrivere?</label>
              {selectedRecipient ? (
                <div className="flex items-center justify-between bg-indigo-900/30 border border-indigo-500/50 rounded p-2">
                    <span className="font-bold text-indigo-300">{selectedRecipient.nome}</span>
                    <button type="button" onClick={handleResetRecipient} className="text-gray-400 hover:text-white px-2">✕</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Digita le iniziali (min 2 caratteri)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {results.length > 0 && (
                    <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                      {results.map((pg) => (
                        <li 
                          key={pg.id} 
                          className="p-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-0"
                          onClick={() => handleSelect(pg)}
                        >
                          {pg.nome}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
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
              />
            </div>

            {/* Testo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Messaggio</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
              <button 
                type="submit" 
                disabled={loading || !selectedRecipient}
                className={`px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-bold transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Invio...' : 'Invia Messaggio'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ComposeMessageModal;