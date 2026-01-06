import React from 'react';

const StatBaseInline = ({ items, options, onChange }) => {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <div className="mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Statistiche Base (Valori Fissi)</h3>
        <p className="text-[9px] text-gray-500 italic uppercase">Visualizzazione automatica di tutti i parametri di sistema</p>
      </div>
      
      <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {options.map((stat) => {
          // Troviamo se esiste un valore salvato nel DB per questa statistica
          const recordIndex = items.findIndex(it => (it.statistica?.id || it.statistica) === stat.id);
          const existingRecord = items[recordIndex];
          
          // Se non esiste nel DB, mostriamo il default del modello Statistica
          const displayValue = existingRecord ? existingRecord.valore_base : stat.valore_base_predefinito;

          return (
            <div key={stat.id} className="flex items-center gap-3 bg-gray-800/30 p-2 rounded hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700">
              <div className="flex-1 flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-300">{stat.nome}</span>
                {/* MODIFICA RICHIESTA: Mostriamo parametro invece di sigla */}
                <span className="text-[9px] text-gray-500 font-mono">({stat.parametro})</span>
              </div>
              
              <div className="w-24">
                <input 
                  type="number" 
                  step="any"
                  className="w-full bg-gray-900 p-1.5 rounded text-xs text-center border border-gray-700 text-amber-500 focus:border-indigo-500 outline-none font-bold"
                  value={displayValue} 
                  onChange={e => {
                    const val = e.target.value;
                    if (recordIndex !== -1) {
                      onChange(recordIndex, 'valore_base', val);
                    } else {
                      // Se il record non esiste, lo creiamo "virtualmente" per il salvataggio
                      onChange(-1, 'statistica', { statId: stat.id, value: val });
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