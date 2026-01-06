import React from 'react';

const StatBaseInline = ({ items, options, onChange, onAdd, onRemove }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Statistiche Base</h3>
      <button onClick={onAdd} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded font-bold">+ AGGIUNGI</button>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => {
        /* FIX: Estrae l'ID sia se statistica è un numero, sia se è un oggetto dal serializer */
        const currentStatId = item.statistica?.id || item.statistica;
        
        return (
          <div key={i} className="flex gap-2 bg-gray-800/40 p-1 rounded">
            <select 
              className="flex-1 bg-gray-900 p-2 rounded text-sm border border-gray-700 text-white outline-none"
              value={currentStatId ? String(currentStatId) : ""} 
              onChange={e => onChange(i, 'statistica', e.target.value ? parseInt(e.target.value, 10) : null)}
            >
              <option value="">Seleziona...</option>
              {options.map(o => (
                <option key={o.id} value={String(o.id)}>{o.nome}</option>
              ))}
            </select>
            <input 
              type="number" step="any" className="w-24 bg-gray-900 p-2 rounded text-sm text-center border border-gray-700 text-white"
              value={item.valore_base} onChange={e => onChange(i, 'valore_base', e.target.value)} 
            />
            <button type="button" onClick={() => onRemove(i)} className="text-red-500 px-2 hover:bg-red-500/10 rounded">✕</button>
          </div>
        );
      })}
    </div>
  </div>
);

export default StatBaseInline;