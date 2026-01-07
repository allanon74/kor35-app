import React, { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, Plus, FilterX } from 'lucide-react';

const MasterGenericList = ({ 
  items, 
  title, 
  onAdd, 
  onEdit, 
  onDelete, 
  addLabel = "Nuovo",
  loading = false,
  // Configurazione filtri: [{ key, label, options, type: 'button' | 'icon' }]
  filterConfig = [], 
  // Configurazione colonne: [{ header, render, width }]
  columns = [],
  // Funzione di ordinamento personalizzata
  sortLogic
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); // Es: { livello: [1,2], tipo: ['MOD'] }

  const toggleFilter = (key, val) => {
    setActiveFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
      return { ...prev, [key]: updated };
    });
  };

  const resetFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  const filteredItems = useMemo(() => {
    const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
    
    // Se non c'è ricerca né filtri, mostriamo nulla (come da tua logica originale)
    if (!searchTerm && !hasActiveFilters) return [];

    let filtered = items.filter(item => {
      const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Controllo dinamico dei filtri (AND tra categorie, OR all'interno della categoria)
      const matchFilters = Object.entries(activeFilters).every(([key, values]) => {
        if (values.length === 0) return true;
        const itemVal = item[key]?.id || item[key]; // Gestisce sia ID che oggetti
        return values.includes(itemVal);
      });

      return matchSearch && matchFilters;
    });

    return sortLogic ? [...filtered].sort(sortLogic) : filtered;
  }, [items, searchTerm, activeFilters, sortLogic]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{title}</h2>
          <button onClick={onAdd} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-2 uppercase text-white">
            <Plus size={16} /> {addLabel}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" placeholder="Cerca per nome..." 
            className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-cyan-500 outline-none text-white"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sezione Filtri Dinamici */}
        {filterConfig.map(conf => (
          <div key={conf.key} className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase w-full md:w-auto">{conf.label}:</span>
            {conf.options.map(opt => (
              <button 
                key={opt.id}
                onClick={() => toggleFilter(conf.key, opt.id)}
                className={`transition-all ${conf.type === 'icon' ? 'p-1 rounded-full border' : 'px-3 py-1 rounded text-xs font-bold border'} ${
                  (activeFilters[conf.key] || []).includes(opt.id)
                  ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' 
                  : 'bg-gray-900 border-gray-700 text-gray-500'
                }`}
                style={conf.type === 'icon' && (activeFilters[conf.key] || []).includes(opt.id) ? { backgroundColor: opt.color } : {}}
              >
                {conf.renderOption ? conf.renderOption(opt) : opt.label}
              </button>
            ))}
          </div>
        ))}

        {Object.values(activeFilters).some(a => a.length > 0) && (
            <button onClick={resetFilters} className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold">
                <FilterX size={14} /> Reset Filtri
            </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right w-24">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-800/50 text-white">
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-4 py-3 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render(item)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onEdit(item)} className="p-2 bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-white rounded-lg transition-all"><Pencil size={14} /></button>
                      <button onClick={() => onDelete(item.id)} className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500 italic text-sm">
                Seleziona dei filtri o cerca per visualizzare i dati.
            </div>
        )}
      </div>
    </div>
  );
};

export default MasterGenericList;