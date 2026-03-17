import React, { useEffect, useMemo, useState } from 'react';
import { getWikiMattoniWidgetDisplay } from '../../api';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';

function safeText(v) {
  return v == null ? '' : String(v);
}

function iconUrlForMattone(m) {
  return m?.icona_url || m?.aura?.icona_url || m?.caratteristica_associata?.icona_url || null;
}

function styleForColorKey(key) {
  const k = safeText(key).trim();
  return CHROMATIC_STYLES[k] || CHROMATIC_STYLES.default;
}

function sortKeyAuraOrdine(m) {
  const auraOrd = m?.aura?.ordine ?? 0;
  const ordine = m?.ordine ?? 0;
  const nome = safeText(m?.nome).toLowerCase();
  return `${String(auraOrd).padStart(5, '0')}-${String(ordine).padStart(5, '0')}-${nome}`;
}

export default function WidgetMattoni({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setData(null);
    getWikiMattoniWidgetDisplay(id)
      .then(res => setData(res))
      .catch(err => {
        console.error(`Errore caricamento Mattoni widget #${id}:`, err);
        setError(true);
      });
  }, [id]);

  const mattoni = useMemo(() => {
    const list = Array.isArray(data?.mattoni) ? data.mattoni : [];
    return [...list].sort((a, b) => sortKeyAuraOrdine(a).localeCompare(sortKeyAuraOrdine(b)));
  }, [data]);

  if (error) {
    return <div className="text-red-500 text-xs border border-red-300 p-2 rounded bg-red-50">Widget Mattoni #{id} non disponibile.</div>;
  }
  if (!data) {
    return <div className="animate-pulse h-20 bg-gray-200 rounded my-4"></div>;
  }

  return (
    <div className="wiki-widget-mattoni my-6 w-full max-w-full break-inside-avoid">
      {data.title && (
        <div className="mb-3">
          <h3 className="text-base md:text-lg font-bold text-gray-800">{data.title}</h3>
        </div>
      )}

      {mattoni.length === 0 ? (
        <div className="text-xs text-gray-600 border border-gray-200 bg-gray-50 rounded p-3">
          Nessun mattone da mostrare.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mattoni.map((m) => {
            const style = styleForColorKey(m?.colore);
            const iconUrl = iconUrlForMattone(m);
            const auraName = m?.aura?.nome || '—';
            const carName = m?.caratteristica_associata?.nome || '—';
            const tipo = m?.tipo || '—';
            const descrizione = m?.descrizione_mattone || m?.descrizione || '';
            const meta = m?.descrizione_metatalento || '';

            return (
              <div
                key={m.id}
                className={`rounded-lg border ${style.border} bg-white shadow-sm overflow-hidden`}
              >
                <div
                  className="p-3 flex items-start gap-3"
                  style={{ background: style.headerBgColor, color: style.headerTextColor }}
                >
                  <div className="shrink-0">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt=""
                        className="h-9 w-9 rounded bg-white/20 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded bg-white/20 flex items-center justify-center text-sm font-bold">
                        {safeText(m?.sigla || m?.nome).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm md:text-base font-bold leading-tight truncate">{m.nome}</div>
                        <div className="text-[10px] md:text-xs opacity-90 mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
                          <span className="px-2 py-0.5 rounded bg-black/20">Tipo: {tipo}</span>
                          <span className="px-2 py-0.5 rounded bg-black/20">Aura: {auraName}</span>
                          <span className="px-2 py-0.5 rounded bg-black/20">Caratt.: {carName}</span>
                        </div>
                      </div>
                      <div className="text-[10px] md:text-xs opacity-80 shrink-0">
                        {m?.ordine != null ? `#${m.ordine}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-3 bg-gradient-to-b ${style.bg} ${style.text}`}>
                  {descrizione && (
                    <div
                      className="prose prose-sm max-w-none wrap-break-words text-xs md:text-sm"
                      dangerouslySetInnerHTML={{ __html: descrizione }}
                    />
                  )}
                  {meta && (
                    <div className="mt-3 border-t border-black/10 pt-2">
                      <div className="text-[11px] md:text-xs font-bold opacity-80">Metatalento</div>
                      <div
                        className="prose prose-sm max-w-none wrap-break-words text-xs md:text-sm"
                        dangerouslySetInnerHTML={{ __html: meta }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

