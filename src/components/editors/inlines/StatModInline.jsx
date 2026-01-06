import React from 'react';

const StatModInline = ({ items, options, auraOptions, elementOptions, onChange, onAdd, onRemove }) => {
  
  const toggleM2M = (index, field, id) => {
    const currentList = items[index][field] || [];
    const newList = currentList.includes(id)
      ? currentList.filter(item => item !== id)
      : [...currentList, id];
    onChange(index, field, newList);
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase">Modificatori Statistici (Mixin)</h3>
        <button onClick={onAdd} className="text-xs bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded">+ Aggiungi</button>
      </div>
      
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-800/80 p-4 rounded border border-gray-700 space-y-4 shadow-inner">
            {/* RIGA 1: STATISTICA E VALORE */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Statistica</label>
                <select className="w-full bg-gray-900 p-2 rounded text-sm border border-gray-600"
                  value={item.statistica} onChange={e => onChange(i, 'statistica', e.target.value)}>
                  <option value="">Seleziona...</option>
                  {options.map(o => <option key={o.id} value={o.id}>{o.nome} ({o.sigla})</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Tipo</label>
                <select className="w-full bg-gray-900 p-2 rounded text-sm border border-gray-600"
                  value={item.tipo_modificatore} onChange={e => onChange(i, 'tipo_modificatore', e.target.value)}>
                  <option value="ADD">Additivo (+)</option>
                  <option value="MOL">Moltiplicatore (x)</option>
                </select>
              </div>
              <div className="w-20">
                <label className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Valore</label>
                <input type="number" className="w-full bg-gray-900 p-2 rounded text-sm text-center border border-gray-600"
                  value={item.valore} onChange={e => onChange(i, 'valore', e.target.value)} />
              </div>
              <button onClick={() => onRemove(i)} className="self-end mb-1 text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors">✕</button>
            </div>

            {/* SEZIONE CONDIZIONI (REPLICA CondizioneStatisticaMixin) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-3 rounded border border-gray-800">
              
              {/* LIMITAZIONE AURE */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="accent-indigo-500" checked={item.usa_limitazione_aura} 
                         onChange={e => onChange(i, 'usa_limitazione_aura', e.target.checked)} />
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase transition-colors">Usa Limite Aura</span>
                </label>
                {item.usa_limitazione_aura && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1">
                    {auraOptions.map(a => (
                      <button key={a.id} onClick={() => toggleM2M(i, 'limit_a_aure', a.id)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-all ${item.limit_a_aure?.includes(a.id) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
                        {a.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LIMITAZIONE ELEMENTI */}
              <div className="space-y-2 border-x border-gray-800 px-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="accent-emerald-500" checked={item.usa_limitazione_elemento} 
                         onChange={e => onChange(i, 'usa_limitazione_elemento', e.target.checked)} />
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase transition-colors">Usa Limite Elemento</span>
                </label>
                {item.usa_limitazione_elemento && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1">
                    {elementOptions.map(el => (
                      <button key={el.id} onClick={() => toggleM2M(i, 'limit_a_elementi', el.id)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-all ${item.limit_a_elementi?.includes(el.id) ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
                        {el.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CONDIZIONE TESTUALE */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="accent-amber-500" checked={item.usa_condizione_text} 
                         onChange={e => onChange(i, 'usa_condizione_text', e.target.checked)} />
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase transition-colors">Condizione Formula</span>
                </label>
                {item.usa_condizione_text && (
                  <input placeholder="es. caratt > 6" className="w-full bg-gray-900 p-2 rounded text-[10px] border border-gray-700 text-amber-500"
                    value={item.condizione_text || ''} onChange={e => onChange(i, 'condizione_text', e.target.value)} />
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatModInline;