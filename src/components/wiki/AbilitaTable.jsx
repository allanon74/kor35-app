import React from 'react';
import PunteggioDisplay from '../PunteggioDisplay';

export default function AbilitaTable({ list, chromaticStyle }) {
  if (!list || list.length === 0) return <p className="text-gray-500 italic text-sm p-2">Nessuna abilità elencata.</p>;

  const cardBorder = chromaticStyle?.border ?? 'border-gray-200';
  const headerBg = chromaticStyle?.headerBg ?? 'bg-gray-50';
  const headerText = chromaticStyle?.headerText ?? 'text-red-900';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
      {list.map((item) => (
        <div key={item.id} className={`bg-white border ${cardBorder} rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow break-inside-avoid`}>
          
          {/* HEADER SCHEDA: Nome + Costo */}
          <div className={`${headerBg} px-3 py-2 border-b border-gray-100 flex justify-between items-center gap-2`}>
            <span className={`font-bold ${headerText} text-sm md:text-base leading-tight truncate`}>
              {item.nome}
            </span>
            
            <div className="flex items-center gap-2 shrink-0">
               {/* Costo */}
               {item.costo && (
                  <span className="text-xs font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                    Costo: {item.costo}
                  </span>
                )}
            </div>
          </div>

          {/* CORPO SCHEDA */}
          <div className="p-3 text-xs md:text-sm text-gray-700 relative">
            
            {/* BADGE CARATTERISTICA (Flottante a destra) */}
            {/* Controllo se esiste e se è un oggetto valido con colore */}
            {item.caratteristica && typeof item.caratteristica === 'object' && (
                <div className="float-right ml-2 mb-1">
                    <PunteggioDisplay 
                        punteggio={item.caratteristica}
                        value={null} // Nessun valore numerico
                        size="badge" // Uso il nuovo preset compatto
                        readOnly={true} // Disabilita click e interazioni
                        iconType="inv_circle"
                    />
                </div>
            )}
            
            {/* Descrizione HTML */}
            <div 
              className="prose prose-sm max-w-none leading-snug"
              dangerouslySetInnerHTML={{ __html: item.descrizione }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}