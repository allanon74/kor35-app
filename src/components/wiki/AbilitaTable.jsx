import React from 'react';

// Se hai il componente PunteggioDisplay importalo qui, altrimenti uso questo fallback grafico
const StatBadge = ({ caratteristica }) => {
  if (!caratteristica) return null;
  
  // Gestisce sia se caratteristica è un oggetto { sigla: 'FOR', ... } sia se è stringa
  const sigla = typeof caratteristica === 'object' ? caratteristica.sigla || caratteristica.nome?.substring(0,3) : caratteristica;
  
  return (
    <div className="float-right ml-2 mb-1 flex flex-col items-center justify-center bg-gray-100 border border-gray-300 rounded p-1 min-w-[30px]">
       <span className="text-[10px] uppercase font-bold text-gray-600">{sigla}</span>
    </div>
  );
};

export default function AbilitaTable({ list }) {
  if (!list || list.length === 0) return <p className="text-gray-500 italic text-sm p-2">Nessuna abilità elencata.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
      {list.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow break-inside-avoid">
          
          {/* HEADER SCHEDA: Nome + Costo */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-red-900 text-sm md:text-base leading-tight">
              {item.nome}
            </span>
            {item.costo && (
              <span className="text-xs font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap ml-2">
                Costo: {item.costo}
              </span>
            )}
          </div>

          {/* CORPO SCHEDA */}
          <div className="p-3 text-xs md:text-sm text-gray-700 relative">
            {/* Display Caratteristica (Flottante a destra) */}
            <StatBadge caratteristica={item.caratteristica} />
            
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