import React from 'react';
import PunteggioDisplay from '../PunteggioDisplay';

/** Colori hex dalla scheda (caratteristica 1, 2, 3) per sfondo header */
function getAbilityColors(item) {
  const out = [];
  if (item.caratteristica?.colore) out.push(normalizeHex(item.caratteristica.colore));
  if (item.caratteristica_2?.colore) out.push(normalizeHex(item.caratteristica_2.colore));
  if (item.caratteristica_3?.colore) out.push(normalizeHex(item.caratteristica_3.colore));
  return out;
}

function normalizeHex(v) {
  const s = String(v).trim();
  return s.startsWith('#') ? s : `#${s}`;
}

function gradientStyle(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  const list = colors.filter(c => c && String(c).trim());
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return `linear-gradient(135deg, ${list.join(', ')})`;
}

function isColorDark(hex) {
  if (!hex) return false;
  const clean = String(hex).trim().replace(/^#/, '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 150;
}

function isGradientDark(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return false;
  const valid = colors.map(c => String(c).trim()).filter(Boolean);
  if (valid.length === 0) return false;
  const darkCount = valid.filter(isColorDark).length;
  return darkCount >= valid.length / 2;
}

/** Stile header per la singola scheda: 1 colore → solido; 2–3 colori → gradiente; testo chiaro/scuro in base allo sfondo */
function getItemHeaderStyle(item, chromaticStyle) {
  const colors = getAbilityColors(item);
  if (colors.length === 0) {
    const headerStyleOverride = chromaticStyle?.headerStyle;
    const headerBgColor = chromaticStyle?.headerBgColor;
    const headerTextColor = chromaticStyle?.headerTextColor;
    if (headerStyleOverride) return headerStyleOverride;
    if (headerBgColor != null && headerTextColor != null) return { background: headerBgColor, color: headerTextColor };
    return undefined;
  }
  const bg = colors.length === 1 ? colors[0] : gradientStyle(colors);
  const textColor = colors.length === 1
    ? (isColorDark(colors[0]) ? '#ffffff' : '#111827')
    : (isGradientDark(colors) ? '#ffffff' : '#111827');
  return { background: bg, color: textColor };
}

export default function AbilitaTable({ list, chromaticStyle }) {
  if (!list || list.length === 0) return <p className="text-gray-500 italic text-sm p-2">Nessuna abilità elencata.</p>;

  const cardBorder = chromaticStyle?.border ?? 'border-gray-200';
  const headerBg = chromaticStyle?.headerBg ?? 'bg-gray-50';
  const headerText = chromaticStyle?.headerText ?? 'text-red-900';
  const bodyBg = chromaticStyle?.bg ?? null;
  const bodyText = chromaticStyle?.text ?? 'text-gray-700';
  const bodyClass = bodyBg ? `bg-gradient-to-b ${bodyBg} ${bodyText}` : bodyText;
  const bodyTextColor = chromaticStyle?.bodyTextColor;
  const bodyStyle = bodyTextColor ? { color: bodyTextColor } : undefined;

  const cardHeaderClass = 'px-3 py-2 border-b border-gray-100 flex justify-between items-center gap-2';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
      {list.map((item) => {
        const cardHeaderStyle = getItemHeaderStyle(item, chromaticStyle);
        return (
          <div key={item.id} className={`bg-white border ${cardBorder} rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow break-inside-avoid`}>
            <div
              className={cardHeaderStyle ? cardHeaderClass : `${cardHeaderClass} ${headerBg} ${headerText}`}
              style={cardHeaderStyle || undefined}
            >
              <span className="font-bold text-sm md:text-base leading-tight truncate">
                {item.nome}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {item.costo && (
                  <span className="text-xs font-mono bg-white/20 border border-current border-opacity-30 px-1.5 py-0.5 rounded whitespace-nowrap">
                    Costo: {item.costo}
                  </span>
                )}
              </div>
            </div>

            <div className={`p-3 text-xs md:text-sm relative ${bodyClass} prose prose-sm max-w-none leading-snug prose-p:my-1`} style={bodyStyle}>
              {/* Badge caratteristiche 1, 2, 3 (se valorizzate) */}
              {(item.caratteristica || item.caratteristica_2 || item.caratteristica_3) && (
                <div className="float-right ml-2 mb-1 flex flex-wrap gap-1 justify-end">
                  {item.caratteristica && typeof item.caratteristica === 'object' && (
                    <PunteggioDisplay punteggio={item.caratteristica} value={null} size="badge" readOnly={true} iconType="inv_circle" />
                  )}
                  {item.caratteristica_2 && typeof item.caratteristica_2 === 'object' && (
                    <PunteggioDisplay punteggio={item.caratteristica_2} value={null} size="badge" readOnly={true} iconType="inv_circle" />
                  )}
                  {item.caratteristica_3 && typeof item.caratteristica_3 === 'object' && (
                    <PunteggioDisplay punteggio={item.caratteristica_3} value={null} size="badge" readOnly={true} iconType="inv_circle" />
                  )}
                </div>
              )}
              <div
                className="prose prose-sm max-w-none leading-snug prose-inherit"
                dangerouslySetInnerHTML={{ __html: item.descrizione }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}