import React, { useState, useEffect, useCallback, useRef } from 'react';
import { staffGetInfusioni } from '../../api'; // Verifica il percorso corretto dei file

const InfusioneList = ({ onSelect, onNew, onLogout }) => {
  // Inizializziamo lo stato con una struttura sicura
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchTimeout = useRef(null);

  const loadInfusioni = async (searchVal, pageNum) => {
    setLoading(true);
    try {
      const response = await staffGetInfusioni(onLogout, { 
        search: searchVal, 
        page: pageNum 
      });

      // LOGICA DI PROTEZIONE:
      // Se il backend restituisce un array diretto (non paginato)
      if (Array.isArray(response)) {
        setData({
          results: response,
          count: response.length,
          next: null,
          previous: null
        });
      } 
      // Se il backend restituisce l'oggetto DRF standard paginato
      else if (response && response.results) {
        setData(response);
      }
      // Fallback per evitare l'errore undefined.length
      else {
        setData({ results: [], count: 0, next: null, previous: null });
      }
    } catch (err) {
      console.error("Errore caricamento lista:", err);
      setData({ results: [], count: 0, next: null, previous: null });
    } finally {
      setLoading(false);
    }
  };

  // Debounce "fatto in casa" senza lodash
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadInfusioni(val, 1);
    }, 500);
  };

  useEffect(() => {
    loadInfusioni(search, page);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [page]);

  // Estraiamo i risultati in modo sicuro per il rendering
  const items = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="🔍 Cerca infusione..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-sm outline-none focus:border-amber-500"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <button onClick={onNew} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold">
          + NUOVA INFUSIONE
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-700">
            <tr>
              <th className="px-6 py-4">Nome Tecnico</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500">Caricamento...</td></tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-200">{item.nome}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded text-[10px] font-bold">
                      {item.tipo_risultato || 'MOD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onSelect(item)} className="text-amber-500 hover:underline font-bold">
                      EDITA
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500 italic">Nessun risultato.</td></tr>
            )}
          </tbody>
        </table>

        {/* Mostra paginazione solo se necessaria (data.count > items.length o se ci sono next/prev) */}
        {(data.next || data.previous) && (
          <div className="bg-gray-900/30 px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <span className="text-xs text-gray-500">Totale: {data.count}</span>
            <div className="flex gap-2">
              <button disabled={!data.previous} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-700 rounded text-xs disabled:opacity-30">Precedente</button>
              <button disabled={!data.next} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-700 rounded text-xs disabled:opacity-30">Successiva</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfusioneList;