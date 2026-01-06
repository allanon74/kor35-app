import React from 'react';

const StatBaseInline = ({ items, options, onChange, onAdd, onRemove }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Statistiche Base (Valori Fissi)</h3>
      <button onClick={onAdd} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded font-bold transition-colors">+ AGGIUNGI</button>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 bg-gray-800/40 p-1 rounded">
          <select 
            className="flex-1 bg-gray-900 p-2 rounded text-sm border border-gray-700 text-white outline-none focus:border-indigo-500"
            value={item.statistica ? String(item.statistica) : ""} 
            onChange={e => {
                const val = e.target.value;
                onChange(i, 'statistica', val ? parseInt(val, 10) : null);
            }}
          >
            <option value="">Seleziona Statistica...</option>
            {options.map(o => (
              <option key={o.id} value={String(o.id)}>
                {o.nome} ({o.sigla})
              </option>
            ))}
          </select>
          <input 
            type="number" 
            step="any"
            placeholder="Valore"
            className="w-24 bg-gray-900 p-2 rounded text-sm text-center border border-gray-700 text-white"
            value={item.valore_base} 
            onChange={e => onChange(i, 'valore_base', e.target.value)} 
          />
          <button type="button" onClick={() => onRemove(i)} className="text-red-500 px-2 hover:bg-red-500/10 rounded transition-colors">✕</button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-600 italic text-center py-2">Nessuna statistica base impostata.</p>}
    </div>
  </div>
);

export default StatBaseInline;