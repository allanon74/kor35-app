import React, { useState, useEffect } from 'react';
import { staffGetTessiture, staffDeleteTessitura } from '../../api';

const TessituraList = ({ onAdd, onEdit, onLogout }) => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    staffGetTessiture(onLogout)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa Tessitura?")) {
      await staffDeleteTessitura(id, onLogout);
      loadData();
    }
  };

  const filteredItems = items.filter(i => 
    i.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-tighter">Gestione Tessiture</h2>
          <input 
            type="text" placeholder="Cerca..." 
            className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none w-64 text-white"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={onAdd} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg font-black text-sm transition-all shadow-md uppercase text-white">
          + Nuova Tessitura
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3 text-center">Livello</th>
              <th className="px-6 py-3">Aura</th>
              <th className="px-6 py-3">Elemento</th>
              <th className="px-6 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-800/50">
                <td className="px-6 py-4 font-bold text-cyan-100">{item.nome}</td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-cyan-950/50 text-cyan-400 px-2 py-1 rounded text-xs font-bold border border-cyan-800/50">
                    Lvl {item.livello}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-indigo-400 font-bold uppercase text-xs">
                    {item.aura_richiesta?.nome || '---'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-emerald-400 font-bold uppercase text-xs">
                    {item.elemento_principale?.nome || '---'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => onEdit(item)} className="bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-white px-3 py-1 rounded border border-amber-600/30 transition-all text-xs font-bold uppercase">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded border border-red-600/30 transition-all text-xs font-bold uppercase">Elimina</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-500 italic">Nessuna tessitura trovata o errore di caricamento.</div>
        )}
      </div>
    </div>
  );
};

export default TessituraList;