import React, { useEffect, useState } from 'react';
import { getWikiTier } from '../../api';
import AbilitaTable from '../wiki/AbilitaTable'; // Riutilizziamo la tabella grafica

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

  // Se il serializer restituisce 'abilita' (come definito sopra), usiamo quello.
  // Fallback a array vuoto.
  // const list = data.abilita || [];
  const sortedList = [...(data.abilita || [])].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  return (
    <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        {/* HEADER DEL TIER */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold uppercase tracking-wider">{data.nome}</h3>
                {data.costo && <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded mt-1 inline-block">Costo Base: {data.costo}</span>}
            </div>
            <div className="text-2xl opacity-20">📊</div>
        </div>

        {/* DESCRIZIONE TIER */}
        {data.descrizione && (
            <div 
            className="p-4 bg-gray-50 text-gray-700 text-sm border-b border-gray-200 italic"
            dangerouslySetInnerHTML={data.descrizione}
            />
                
            
        )}

        {/* LISTA ABILITÀ (TABELLA) */}
        <div className="p-0">
            <AbilitaTable list={sortedList} />
        </div>
    </div>
  );
}