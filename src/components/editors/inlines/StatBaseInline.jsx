import React from 'react';

const StatBaseInline = ({ items, options, onChange }) => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <div className="mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Statistiche Base</h3>
        <p className="text-[9px] text-gray-500 italic uppercase">Parametri fissi della tecnica</p>
      </div>
      
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {options.map((stat) => {
          // Trova il record (gestisce sia ID che oggetto)
          const existingRecord = items.find(it => (it.statistica?.id || it.statistica) === stat.id);
          
          // Fallback al valore di default della statistica se il record non esiste o è nullo
          const displayValue = (existingRecord?.valore_base !== null && existingRecord?.valore_base !== undefined && existingRecord?.valore_base !== "") 
                                ? existingRecord.valore_base 
                                : (stat.valore_base_predefinito ?? 0);

          return (
            <div key={stat.id} className="flex items-center gap-3 bg-gray-800/30 p-2 rounded hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700">
              <div className="flex-1 flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-300">{stat.nome}</span>
                {/* Visualizziamo PARAMETRO tra parentesi */}
                <span className="text-[9px] text-gray-500 font-mono italic">({stat.parametro})</span>
              </div>
              
              <div className="w-24">
                <input 
                  type="number" 
                  step="any"
                  className="w-full bg-gray-900 p-1.5 rounded text-xs text-center border border-gray-700 text-amber-500 focus:border-indigo-500 outline-none font-bold"
                  value={displayValue} 
                  onChange={e => {
                    const newVal = e.target.value;
                    const recordIndex = items.findIndex(it => (it.statistica?.id || it.statistica) === stat.id);
                    if (recordIndex !== -1) {
                      onChange(recordIndex, 'valore_base', newVal);
                    } else {
                      // Creazione pivot se il record non esisteva ancora
                      onChange(-1, 'statistica', { statId: stat.id, value: newVal });
                    }
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatBaseInline;