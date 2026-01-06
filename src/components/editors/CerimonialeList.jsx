import React, { useState, useEffect } from 'react';
import { staffGetCerimoniali, staffDeleteCerimoniale } from '../../api';

const CerimonialeList = ({ onAdd, onEdit, onLogout }) => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    staffGetCerimoniali(onLogout)
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo Cerimoniale?")) {
      await staffDeleteCerimoniale(id, onLogout);
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
          <h2 className="text-xl font-bold text-amber-500 uppercase tracking-tighter">Gestione Cerimoniali</h2>
          <input 
            type="text" placeholder="Cerca cerimoniale..." 
            className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 outline-none w-64"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={onAdd} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-lg font-black text-sm transition-all shadow-md uppercase">
          + Nuovo Cerimoniale
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Aura Richiesta</th>
              <th className="px-6 py-3">Durata</th>
              <th className="px-6 py-3">Partecipanti</th>
              <th className="px-6 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-700/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-amber-100">{item.nome}</td>
                <td className="px-6 py-4">
                  <span className="text-xs text-indigo-400 font-bold uppercase">
                    {item.aura_richiesta?.nome || 'Libera'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 italic text-xs">{item.durata_cerimoniale || 'N/D'}</td>
                <td className="px-6 py-4 font-bold text-gray-500">{item.num_partecipanti} Min.</td>
                <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(item)} className="text-amber-500 hover:bg-amber-500/10 px-3 py-1 rounded border border-amber-500/20">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-500/10 px-3 py-1 rounded border border-red-500/20">Elimina</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-500 italic">Nessun cerimoniale trovato.</div>
        )}
      </div>
    </div>
  );
};

export default CerimonialeList;