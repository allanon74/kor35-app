import React, { useEffect, useState } from 'react';
import { getWikiTier } from '../../api';
import AbilitaTable from '../wiki/AbilitaTable'; 

export default function WidgetTier({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getWikiTier(id)
       .then(res => setData(res))
       .catch(err => {
         console.error(`Errore caricamento Tier #${id}:`, err);
         setError(true);
       });
  }, [id]);

  if (error) return <div className="text-red-500 text-xs border border-red-300 p-2 rounded bg-red-50">Tier #{id} non disponibile.</div>;
  if (!data) return <div className="animate-pulse h-20 bg-gray-200 rounded my-4"></div>;

  const sortedList = [...(data.abilita || [])].sort((a, b) => 
    (a.nome || '').localeCompare(b.nome || '')
  );

  return (
    // w-full e max-w-full prevengono lo sforamento laterale
    <div className="my-6 w-full max-w-full border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm break-inside-avoid">
        {/* Header Responsivo */}
        <div className="bg-gray-800 text-white p-3 md:p-4 flex flex-row justify-between items-center gap-2">
            <div className="flex flex-col">
                <h3 className="text-base md:text-xl font-bold uppercase tracking-wider leading-tight">{data.nome}</h3>
                {data.costo && (
                  <span className="text-[10px] md:text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded mt-1 self-start">
                    Costo Base: {data.costo}
                  </span>
                )}
            </div>
            <div className="text-xl md:text-2xl opacity-20 select-none">📊</div>
        </div>

        {/* Descrizione */}
        {data.descrizione && (
            <div 
              className="p-3 md:p-4 bg-gray-50 text-gray-700 text-xs md:text-sm border-b border-gray-200 italic prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: data.descrizione }}
            />
        )}

        {/* Contenitore Tabella */}
        <div className="p-0 w-full">
            <AbilitaTable list={sortedList} />
        </div>
    </div>
  );
}