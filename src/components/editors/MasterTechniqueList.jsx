import React, { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterContext';
import IconaPunteggio from '../IconaPunteggio';
import { Search, Pencil, Trash2, Plus, FilterX } from 'lucide-react';

const MasterTechniqueList = ({ 
  items, 
  title, 
  onAdd, 
  onEdit, 
  onDelete, 
  addLabel = "Nuovo",
  loading = false 
}) => {
  const { punteggiList } = useCharacter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stati filtri: partono vuoti (tutto spento)
  const [activeLevels, setActiveLevels] = useState([]);
  const [activeAuras, setActiveAuras] = useState([]);

  const aurasOptions = useMemo(() => punteggiList.filter(p => p.tipo === 'AU'), [punteggiList]);
  const levels = [1, 2, 3, 4, 5, 6, 7];

  // Logica di filtraggio
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Se non c'è nulla di selezionato nei filtri, non mostriamo nulla (come richiesto)
      // tranne se l'utente sta cercando per nome (opzionale, decidiamo di mostrare solo se i filtri passano)
      const levelMatch = activeLevels.length === 0 ? false : activeLevels.includes(item.livello || item.liv);
      
      const itemAuraId = item.aura_richiesta?.id || item.aura_richiesta;
      const auraMatch = activeAuras.length === 0 ? false : activeAuras.includes(itemAuraId);

      // Mostriamo se: (Livello OK O Aura OK) E Ricerca OK
      // Nota: se vuoi che debbano corrispondere ENTRAMBI i filtri attivi, usa AND. 
      // Qui usiamo OR tra i filtri "categoria" per permettere di vedere "tutti i liv 1" o "tutti i Fuoco"
      return (levelMatch || auraMatch) && matchSearch;
    });
  }, [items, searchTerm, activeLevels, activeAuras]);

  const toggleFilter = (list, setList, val) => {
    setList(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const resetFilters = () => {
    setActiveLevels([]);
    setActiveAuras([]);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Header e Ricerca */}
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

        {/* Barra Filtri Livelli */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-gray-500 uppercase w-full md:w-auto">Livelli:</span>
          {levels.map(l => (
            <button 
              key={l}
              onClick={() => toggleFilter(activeLevels, setActiveLevels, l)}
              className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                activeLevels.includes(l) 
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(8,145,178,0.4)]' 
                : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Barra Filtri Aure */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-gray-500 uppercase w-full md:w-auto">Aure:</span>
          {aurasOptions.map(aura => (
            <button 
              key={aura.id}
              onClick={() => toggleFilter(activeAuras, setActiveAuras, aura.id)}
              className={`p-1 rounded-full border transition-all ${
                activeAuras.includes(aura.id) 
                ? 'border-white scale-110 shadow-lg' 
                : 'border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
              style={{ backgroundColor: activeAuras.includes(aura.id) ? aura.colore : 'transparent' }}
            >
              <IconaPunteggio url={aura.icona_url || aura.icona} color={aura.colore} size="xs" mode="cerchio_inv" />
            </button>
          ))}
          <button onClick={resetFilters} className="ml-auto text-gray-500 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold">
            <FilterX size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Tabella Compatta */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
              <th className="px-4 py-3 text-center w-16">Lvl</th>
              <th className="px-2 py-3 text-center w-12">Au</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3 text-right w-24">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {filteredItems.map(item => {
              const aura = item.aura_richiesta;
              return (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-800/50">
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-gray-400">{item.livello || item.liv}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {aura ? (
                      <div className="flex justify-center" title={aura.nome}>
                        <IconaPunteggio url={aura.icona_url || aura.icona} color={aura.colore} size="xs" mode="cerchio_inv" />
                      </div>
                    ) : (
                      <span className="text-gray-600 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-cyan-50">
                    <div className="truncate max-w-[150px] md:max-w-xs">{item.nome}</div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
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
              );
            })}
          </tbody>
        </table>

        {(activeLevels.length === 0 && activeAuras.length === 0) && (
          <div className="p-12 text-center space-y-2">
            <div className="text-cyan-500/50 flex justify-center"><FilterX size={48} /></div>
            <p className="text-gray-500 italic text-sm">Seleziona un Livello o un'Aura per visualizzare i dati.</p>
          </div>
        )}

        {filteredItems.length === 0 && (activeLevels.length > 0 || activeAuras.length > 0) && !loading && (
          <div className="p-10 text-center text-gray-500 italic">Nessun risultato con i filtri selezionati.</div>
        )}
      </div>
    </div>
  );
};

export default MasterTechniqueList;