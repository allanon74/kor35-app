import React, { useEffect, useState } from 'react';
import { getWikiTier } from '../../api';
import AbilitaTable from '../wiki/AbilitaTable';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';

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

  const style = CHROMATIC_STYLES[data.color_style] || CHROMATIC_STYLES.default;

  return (
    <div className={`my-6 w-full max-w-full border ${style.border} rounded-lg bg-white shadow-sm break-inside-avoid overflow-hidden`}>
        {/* HEADER DEL TIER */}
        <div className={`${style.headerBg} ${style.headerText} p-3 md:p-4 flex flex-row justify-between items-center gap-2 rounded-t-lg`}>
            <div className="flex flex-col">
                <h3 className="text-base md:text-xl font-bold uppercase tracking-wider leading-tight">{data.nome}</h3>
                {data.costo && (
                  <span className="text-[10px] md:text-xs opacity-80 px-2 py-0.5 rounded mt-1 self-start bg-black/20">
                    Costo Base: {data.costo}
                  </span>
                )}
            </div>
            <div className="text-xl md:text-2xl opacity-20 select-none">📊</div>
        </div>

        {/* DESCRIZIONE TIER */}
        {data.descrizione && (
            <div 
              className={`p-3 md:p-4 bg-gradient-to-b ${style.bg} ${style.text} text-xs md:text-sm border-b ${style.border} italic prose prose-sm max-w-none wrap-break-words`}
              dangerouslySetInnerHTML={{ __html: data.descrizione }}
            />
        )}

        {/* GRIGLIA ABILITÀ con stile cromatico (sfondo e testo descrizione) */}
        <div className={`w-full bg-gradient-to-b ${style.bg} ${style.text} p-2`}>
            <AbilitaTable list={sortedList} chromaticStyle={style} />
        </div>
    </div>
  );
}