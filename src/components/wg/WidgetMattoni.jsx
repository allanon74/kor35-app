import React, { useEffect, useMemo, useState } from 'react';
import { getWikiMattoniWidgetDisplay } from '../../api';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';

/** Mappa colore hex (come nel mattone) -> chiave stile Tier (CHROMATIC_STYLES) */
const HEX_TO_CHROMATIC_KEY = {
  '#860050': 'porpora',
  '#fa0000': 'red',
  '#c79e0b': 'ochre',
  '#b6cdd9': 'gray',
  '#135cd1': 'blue',
  '#ffffff': 'white',
  '#efaaff': 'purple',
  '#92fa88': 'green',
  '#000000': 'black',
  '#faf610': 'yellow',
};
(function () {
  const withHash = { ...HEX_TO_CHROMATIC_KEY };
  Object.keys(withHash).forEach(hex => {
    const noHash = hex.replace(/^#/, '').toLowerCase();
    HEX_TO_CHROMATIC_KEY[noHash] = withHash[hex];
  });
})();
function normalizeHex(h) {
  if (h == null || h === '') return '';
  const s = String(h).trim().toLowerCase();
  return s.startsWith('#') ? s : `#${s}`;
}

function safeText(v) {
  return v == null ? '' : String(v);
}

function iconUrlForMattone(m) {
  return m?.icona_url || m?.aura?.icona_url || m?.caratteristica_associata?.icona_url || null;
}

/** Ricava la chiave stile da colore (hex o nome chiave) e ritorna l'oggetto stile come nel Widget Tier. */
function styleForMattoneColore(colore) {
  const raw = safeText(colore).trim();
  if (!raw) return CHROMATIC_STYLES.default;
  const hex = normalizeHex(raw);
  const keyFromHex = HEX_TO_CHROMATIC_KEY[hex] || HEX_TO_CHROMATIC_KEY[hex.replace('#', '')];
  const styleKey = keyFromHex || raw.toLowerCase();
  return CHROMATIC_STYLES[styleKey] || CHROMATIC_STYLES.default;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
          {mattoni.map((m) => {
            const style = styleForMattoneColore(m?.colore);
            const iconUrl = iconUrlForMattone(m);
            const auraName = m?.aura?.nome || '—';
            const carName = m?.caratteristica_associata?.nome || '—';
            const tipoLabel = m?.tipo_display || m?.tipo || '—';
            const descrizione = m?.descrizione_mattone || m?.descrizione || '';
            const meta = m?.descrizione_metatalento || '';

            // allineamento ai token/markup di AbilitaTable (widget Tier)
            const cardBorder = style?.border ?? 'border-gray-200';
            const bodyBg = style?.bg ?? null;
            const bodyText = style?.text ?? 'text-gray-700';
            const bodyClass = bodyBg ? `bg-gradient-to-b ${bodyBg} ${bodyText}` : bodyText;
            const bodyStyle = style?.bodyTextColor ? { color: style.bodyTextColor } : undefined;
            const cardHeaderStyle =
              style?.headerBgColor != null && style?.headerTextColor != null
                ? { background: style.headerBgColor, color: style.headerTextColor }
                : undefined;

            return (
              <div
                key={m.id}
                className={`bg-white border ${cardBorder} rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow break-inside-avoid`}
              >
                <div
                  className="px-3 py-2 border-b border-gray-100 flex justify-between items-center gap-2"
                  style={cardHeaderStyle}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="shrink-0">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt=""
                          className="h-7 w-7 rounded bg-white/20 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded bg-white/20 flex items-center justify-center text-xs font-bold">
                          {safeText(m?.sigla || m?.nome).slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm md:text-base leading-tight truncate">
                      {m.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono bg-white/20 border border-current border-opacity-30 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {tipoLabel}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 text-xs md:text-sm relative ${bodyClass} prose prose-sm max-w-none leading-snug prose-p:my-1`}
                  style={bodyStyle}
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="text-[10px] md:text-xs bg-white/20 border border-current border-opacity-20 px-2 py-0.5 rounded">
                      Aura: {auraName}
                    </span>
                    <span className="text-[10px] md:text-xs bg-white/20 border border-current border-opacity-20 px-2 py-0.5 rounded">
                      Caratt.: {carName}
                    </span>
                    {m?.ordine != null && (
                      <span className="text-[10px] md:text-xs bg-white/20 border border-current border-opacity-20 px-2 py-0.5 rounded">
                        Ordine: {m.ordine}
                      </span>
                    )}
                  </div>

                  {descrizione && (
                    <div
                      className="prose prose-sm max-w-none leading-snug prose-inherit"
                      dangerouslySetInnerHTML={{ __html: descrizione }}
                    />
                  )}
                  {meta && (
                    <div className="mt-3 border-t border-black/10 pt-2">
                      <div className="text-[11px] md:text-xs font-bold opacity-80">Metatalento</div>
                      <div
                        className="prose prose-sm max-w-none leading-snug prose-inherit"
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

