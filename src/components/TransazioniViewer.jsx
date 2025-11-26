import React, { useState } from 'react';
import { useTransazioni } from '../hooks/useGameData';

const TransazioniViewer = () => {
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState('entrata'); // 'entrata' o 'uscita'
  
  const { data, isLoading, isPlaceholderData } = useTransazioni(page, tipo);

  return (
    <div className="transazioni-container">
      <div className="flex space-x-4 mb-4 border-b border-gray-700 pb-2">
        <button 
            onClick={() => { setTipo('entrata'); setPage(1); }}
            className={`px-3 py-1 rounded ${tipo === 'entrata' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
            In Entrata (Richieste a me)
        </button>
        <button 
            onClick={() => { setTipo('uscita'); setPage(1); }}
            className={`px-3 py-1 rounded ${tipo === 'uscita' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
            In Uscita (Mie richieste)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-4">Caricamento...</div>
      ) : (
        <div className="space-y-2">
            {data?.results?.length === 0 && <p className="text-gray-500 italic">Nessuna transazione trovata.</p>}
            
            {data?.results?.map((t) => (
            <div key={t.id} className="p-3 bg-gray-800 rounded border border-gray-700 flex justify-between items-center">
                <div>
                    <div className="font-bold">{t.oggetto}</div>
                    <div className="text-xs text-gray-400">
                        {tipo === 'entrata' ? `Da: ${t.richiedente}` : `A: ${t.mittente}`} 
                        {' - '} {new Date(t.data_richiesta).toLocaleDateString()}
                    </div>
                    <div className="text-xs mt-1 status-badge">Stato: {t.stato}</div>
                </div>
                {/* Qui potresti aggiungere i bottoni Accetta/Rifiuta se necessario */}
            </div>
            ))}
        </div>
      )}

      {/* Paginazione */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(old => Math.max(old - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-600 rounded disabled:opacity-50"
        >
          &lt; Prev
        </button>
        <span className="text-sm py-1">Pag. {page}</span>
        <button
          onClick={() => {
            if (!isPlaceholderData && data?.next) setPage(old => old + 1);
          }}
          disabled={isPlaceholderData || !data?.next}
          className="px-3 py-1 bg-gray-600 rounded disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default TransazioniViewer;