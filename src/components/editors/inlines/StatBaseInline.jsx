import React from 'react';

const StatBaseInline = ({ items, options, onChange }) => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <div className="mb-4 border-b border-gray-700 pb-2">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Statistiche Base</h3>
        <p className="text-[9px] text-gray-500 italic uppercase">Valori fissi dell'infusione</p>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {options.map((stat) => {
          // 1. Troviamo se nel DB esiste già un valore per questa statistica
          // Gestiamo sia se l'oggetto è annidato che se è un ID semplice
          const recordIndex = items.findIndex(it => (it.statistica?.id || it.statistica) === stat.id);
          const existingRecord = items[recordIndex];
          
          // 2. Se non esiste, il valore visualizzato è il default della statistica
          const displayValue = existingRecord ? existingRecord.valore_base : stat.valore_base_predefinito;

          return (
            <div key={stat.id} className="flex items-center gap-3 bg-gray-800/40 p-2 rounded hover:bg-gray-800/60 transition-colors">
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-300">{stat.nome}</span>
                <span className="text-[10px] text-gray-500 ml-2">({stat.sigla})</span>
              </div>
              
              <div className="w-24">
                <input 
                  type="number" 
                  step="any"
                  className="w-full bg-gray-900 p-1.5 rounded text-sm text-center border border-gray-700 text-white focus:border-indigo-500 outline-none"
                  value={displayValue} 
                  onChange={e => {
                    const newVal = e.target.value;
                    // Se il record esiste, lo aggiorniamo
                    if (recordIndex !== -1) {
                      onChange(recordIndex, 'valore_base', newVal);
                    } else {
                      // Se il record non esiste nel DB, lo creiamo "al volo" nello stato del padre
                      // Questa logica viene gestita richiamando una funzione speciale nel padre (vedi sotto)
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