import React, { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, Plus, FilterX } from 'lucide-react';

/**
 * MasterGenericList
 * Componente core per la gestione delle liste Staff/Master.
 * Mantiene la compatibilità con OggettoList e OggettoBaseList.
 */
const MasterGenericList = ({ 
  items = [], 
  title, 
  onAdd, 
  onEdit, 
  onDelete, 
  addLabel = "Nuovo",
  loading = false,
  // filterConfig: [{ key, label, options, type, renderOption, match }]
  filterConfig = [], 
  // columns: [{ header, render, width, align }]
  columns = [],
  // sortLogic: (a, b) => number
  sortLogic,
  // Messaggio visualizzato quando non ci sono risultati o filtri attivi
  emptyMessage = "Seleziona dei filtri o cerca per visualizzare i dati."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); // Stato: { [key]: [array_di_id_selezionati] }

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
    
    // --- CORREZIONE QUI ---
    // Nascondiamo i risultati di default SOLO se ci sono filtri configurati (filterConfig.length > 0)
    // Se non ci sono filtri (es. Mostri), mostriamo tutto subito.
    if (!searchTerm && !hasActiveFilters && filterConfig.length > 0) return []; 
    // ----------------------

    let filtered = items.filter(item => {
      // 1. Ricerca testuale
      const matchSearch = (item.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      // 2. Filtri dinamici
      return Object.entries(activeFilters).every(([key, values]) => {
        if (values.length === 0) return true;
        const conf = filterConfig.find(c => c.key === key);
        if (conf?.match) return conf.match(item, values);
        const itemVal = item[key]?.id !== undefined ? item[key].id : item[key];
        return values.includes(itemVal);
      });
    

    return sortLogic ? [...filtered].sort(sortLogic) : filtered;
  }, [items, searchTerm, activeFilters, sortLogic, filterConfig]);

    // 3. Ordinamento (se fornito)
    return sortLogic ? [...filtered].sort(sortLogic) : filtered;
  }, [items, searchTerm, activeFilters, sortLogic, filterConfig]);

  return (
    <div className="space-y-4">
      {/* Barra Superiore: Titolo e Azioni */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{title}</h2>
          <div className="flex items-center gap-3">
            {Object.values(activeFilters).some(a => a.length > 0) && (
                <button 
                  onClick={resetFilters} 
                  className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold transition-colors"
                >
                    <FilterX size={14} /> Reset
                </button>
            )}
            <button 
              onClick={onAdd} 
              className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-2 uppercase text-white shadow-lg active:scale-95"
            >
              <Plus size={16} /> {addLabel}
            </button>
          </div>
        </div>

        {/* Input Ricerca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Cerca per nome..." 
            className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-cyan-500 outline-none text-white transition-all placeholder:text-gray-700"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sezione Filtri Configurabili */}
        {filterConfig.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-700/50">
            {filterConfig.map(conf => (
              <div key={conf.key} className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase w-full md:w-auto min-w-[70px]">
                  {conf.label}:
                </span>
                <div className="flex flex-wrap gap-2">
                    {conf.options.map(opt => {
                      const isActive = (activeFilters[conf.key] || []).includes(opt.id);
                      return (
                        <button 
                          key={opt.id}
                          onClick={() => toggleFilter(conf.key, opt.id)}
                          title={opt.label || opt.nome}
                          className={`transition-all duration-200 ${conf.type === 'icon' ? 'p-1 rounded-full border' : 'px-3 py-1 rounded text-xs font-bold border'} ${
                            isActive
                            ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg scale-105' 
                            : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                          }`}
                          style={conf.type === 'icon' && isActive ? { backgroundColor: opt.colore || opt.color } : {}}
                        >
                          {conf.renderOption ? conf.renderOption(opt, isActive) : (opt.label || opt.nome)}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabella Dati */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-4 py-3 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`} 
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-right w-24">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50 text-sm">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-800/50 text-white group">
                  {columns.map((col, idx) => (
                    <td 
                      key={idx} 
                      className={`px-4 py-3 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(item)} 
                          className="p-2 bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-white rounded-lg transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => onDelete(item.id)} 
                          className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stati Vuoti o Loading */}
        {loading ? (
            <div className="p-12 text-center text-cyan-500 animate-pulse font-black uppercase tracking-widest">
                Caricamento dati in corso...
            </div>
        ) : filteredItems.length === 0 && (
            <div className="p-12 text-center space-y-3">
                <div className="text-gray-700 flex justify-center"><FilterX size={48} /></div>
                <p className="text-gray-500 italic text-sm max-w-xs mx-auto">
                    {emptyMessage}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default MasterGenericList;