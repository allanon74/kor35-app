import React, { useState } from 'react';
import { useTransazioni } from '../hooks/useGameData';
import { useCharacter } from './CharacterContext'; // Importa il context

const TransazioniViewer = () => {
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState('entrata'); 
  
  // Prendi l'ID del personaggio selezionato
  const { selectedCharacterId } = useCharacter();
  
  // Passalo all'hook
  const { data, isLoading, isPlaceholderData } = useTransazioni(page, tipo, selectedCharacterId);

  if (!selectedCharacterId) {
      return <div className="text-center p-4 text-gray-500">Seleziona un personaggio per vedere le transazioni.</div>;
  }

  return (
    <div className="transazioni-container">
      <div className="flex space-x-4 mb-4 border-b border-gray-700 pb-2">
        <button 
            onClick={() => { setTipo('entrata'); setPage(1); }}
            className={`px-3 py-1 rounded transition-colors ${tipo === 'entrata' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
            In Entrata (Richieste a te)
        </button>
        <button 
            onClick={() => { setTipo('uscita'); setPage(1); }}
            className={`px-3 py-1 rounded transition-colors ${tipo === 'uscita' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
            In Uscita (Tue richieste)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-4 text-gray-400 animate-pulse">Caricamento transazioni...</div>
      ) : (
        <div className="space-y-2">
            {data?.results?.length === 0 && (
                <div className="text-center p-8 border border-dashed border-gray-700 rounded bg-gray-800/50">
                    <p className="text-gray-500 italic">Nessuna transazione trovata in {tipo}.</p>
                </div>
            )}
            
            {data?.results?.map((t) => (
            <div key={t.id} className="p-3 bg-gray-800 rounded border border-gray-700 flex justify-between items-center hover:border-gray-500 transition-colors">
                <div>
                    <div className="font-bold text-indigo-300">{t.oggetto}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {tipo === 'entrata' ? (
                            <>Da: <span className="text-white">{t.richiedente}</span></>
                        ) : (
                            <>A: <span className="text-white">{t.mittente}</span></>
                        )}
                        <span className="mx-2 text-gray-600">|</span>
                        {new Date(t.data_richiesta).toLocaleDateString()}
                    </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded font-bold ${
                    t.stato === 'IN_ATTESA' ? 'bg-yellow-900 text-yellow-200' :
                    t.stato === 'ACCETTATA' ? 'bg-green-900 text-green-200' :
                    'bg-red-900 text-red-200'
                }`}>
                    {t.stato.replace('_', ' ')}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Paginazione */}
      <div className="flex justify-between mt-4 pt-2 border-t border-gray-800">
        <button
          onClick={() => setPage(old => Math.max(old - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-30 hover:bg-gray-600 text-sm"
        >
          &lt; Indietro
        </button>
        <span className="text-xs py-1.5 text-gray-500">Pagina {page}</span>
        <button
          onClick={() => {
            if (!isPlaceholderData && data?.next) setPage(old => old + 1);
          }}
          disabled={isPlaceholderData || !data?.next}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-30 hover:bg-gray-600 text-sm"
        >
          Avanti &gt;
        </button>
      </div>
    </div>
  );
};

export default TransazioniViewer;