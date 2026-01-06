import React, { useState, useEffect, useCallback } from 'react';
import { staffGetInfusioni } from '../../api';
import { debounce } from 'lodash'; // Se non l'hai, puoi usare un timeout semplice

const InfusioneList = ({ onSelect, onNew, onLogout }) => {
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Funzione di caricamento dati
  const loadInfusioni = async (searchVal, pageNum) => {
    setLoading(true);
    try {
      const response = await staffGetInfusioni(onLogout, { 
        search: searchVal, 
        page: pageNum 
      });
      // DRF restituisce { count, next, previous, results } se la paginazione è attiva
      setData(response);
    } catch (err) {
      console.error("Errore caricamento lista:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce della ricerca per non sparare query a raffica
  const debouncedSearch = useCallback(
    debounce((val) => {
      setPage(1); // Torna alla prima pagina quando cerchi
      loadInfusioni(val, 1);
    }, 500),
    []
  );

  useEffect(() => {
    loadInfusioni(search, page);
  }, [page]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    debouncedSearch(val);
  };

  return (
    <div className="space-y-6">
      {/* HEADER E RICERCA */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Cerca per nome o descrizione..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <button
          onClick={onNew}
          className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <span>+</span> NUOVA INFUSIONE
        </button>
      </div>

      {/* TABELLA RISULTATI */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-900/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-700">
            <tr>
              <th className="px-6 py-4">Nome Tecnico</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Aura Req.</th>
              <th className="px-6 py-4 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 animate-pulse">Caricamento dati...</td></tr>
            ) : data.results.length > 0 ? (
              data.results.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-200">{item.nome}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.tipo_risultato === 'MAT' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' :
                      item.tipo_risultato === 'MOD' ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' :
                      'bg-orange-900/40 text-orange-400 border border-orange-800/50'
                    }`}>
                      {item.tipo_risultato}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono uppercase">{item.aura_richiesta_nome || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onSelect(item)}
                      className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1 rounded border border-indigo-500/30 transition-all text-xs font-bold"
                    >
                      EDITA
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">Nessun risultato trovato.</td></tr>
            )}
          </tbody>
        </table>

        {/* CONTROLLI PAGINAZIONE */}
        <div className="bg-gray-900/30 px-6 py-4 flex items-center justify-between border-t border-gray-700">
          <div className="text-xs text-gray-500 font-bold">
            Totale: <span className="text-gray-300">{data.count}</span> infusioni
          </div>
          <div className="flex gap-2">
            <button
              disabled={!data.previous || loading}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              Precedente
            </button>
            <span className="px-3 py-1 text-xs text-amber-500 font-black bg-amber-500/10 rounded border border-amber-500/20">
              Pagina {page}
            </span>
            <button
              disabled={!data.next || loading}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              Successiva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfusioneList;