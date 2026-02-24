import React, { useEffect, useState } from 'react';
import { getWikiTier } from '../../api';
import AbilitaTable from '../wiki/AbilitaTable';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';

/** Costruisce la stringa CSS per il gradiente (135deg) da una lista di colori hex */
function gradientStyle(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  const list = colors.filter(c => c && String(c).trim());
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return `linear-gradient(135deg, ${list.join(', ')})`;
}

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

  const useGradient = Array.isArray(data.gradient_colors) && data.gradient_colors.length > 0;
  const gradientBg = useGradient ? gradientStyle(data.gradient_colors) : null;
  const style = CHROMATIC_STYLES[data.color_style] || CHROMATIC_STYLES.default;

  const headerStyle = gradientBg
    ? { background: gradientBg, color: 'white' }
    : undefined;
  const headerClass = gradientBg
    ? 'p-3 md:p-4 flex flex-row justify-between items-center gap-2 rounded-t-lg'
    : `${style.headerBg} ${style.headerText} p-3 md:p-4 flex flex-row justify-between items-center gap-2 rounded-t-lg`;

  const bodyClass = gradientBg
    ? 'w-full p-2 text-gray-800 bg-gray-50'
    : `w-full bg-gradient-to-b ${style.bg} ${style.text} p-2`;

  const borderClass = gradientBg ? 'border-gray-300' : style.border;
  const descClass = gradientBg
    ? 'p-3 md:p-4 text-xs md:text-sm border-b border-gray-200 italic prose prose-sm max-w-none wrap-break-words text-gray-800 bg-gray-50'
    : `p-3 md:p-4 bg-gradient-to-b ${style.bg} ${style.text} text-xs md:text-sm border-b ${style.border} italic prose prose-sm max-w-none wrap-break-words`;

  return (
    <div className={`my-6 w-full max-w-full border ${borderClass} rounded-lg bg-white shadow-sm break-inside-avoid overflow-hidden`}>
        {/* HEADER DEL TIER */}
        <div className={headerClass} style={headerStyle}>
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
              className={descClass}
              dangerouslySetInnerHTML={{ __html: data.descrizione }}
            />
        )}

        {/* GRIGLIA ABILITÀ: collapsible se data.abilities_collapsible, aperto/chiuso da data.abilities_collapsed_by_default */}
        {data.abilities_collapsible !== false ? (
          <details
            className={bodyClass}
            open={data.abilities_collapsed_by_default === false}
          >
            <summary className="cursor-pointer font-semibold py-2 px-3 list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
              Abilità
            </summary>
            <div className="pt-0 px-2 pb-2">
              <AbilitaTable list={sortedList} chromaticStyle={gradientBg ? { ...style, text: 'text-gray-800', icon: 'bg-gray-500' } : style} />
            </div>
          </details>
        ) : (
          <div className={bodyClass}>
            <AbilitaTable list={sortedList} chromaticStyle={gradientBg ? { ...style, text: 'text-gray-800', icon: 'bg-gray-500' } : style} />
          </div>
        )}
    </div>
  );
}