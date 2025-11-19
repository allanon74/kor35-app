import React from 'react';

// Funzione helper per il contrasto
const getTextColorForBg = (hexColor) => {
  try {
    const hex = hexColor.replace('#', ''); 
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminanza = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminanza > 0.5 ? 'black' : 'white';
  } catch (e) {
    return 'white'; // Fallback
  }
};

/**
 * Componente riutilizzabile per mostrare un Punteggio (es. Caratteristica).
 * @param {object} punteggio - L'oggetto Punteggio completo dal context
 * @param {string|number} [value] - Il valore numerico da mostrare (es. "10")
 * @param {string} [displayText="abbr"] - Cosa mostrare: "abbr", "name", o "none"
 * @param {string} [iconType="inv_circle"] - Icona: "inv_circle", "circle", "raw", o "none"
 * @param {string} [size="m"] - Taglia: "xs", "s", "m", "l", "xl"
 */
const PunteggioDisplay = ({ 
  punteggio, 
  value, 
  displayText = "abbr", 
  iconType = "inv_circle",
  size = "m" // Default taglia media
}) => {
  
  // Fallback se il punteggio non è valido
  if (!punteggio || !punteggio.colore) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
        <span className="font-semibold text-gray-300">Dato non disponibile</span>
        {value && <span className="text-xl font-bold text-white">{value}</span>}
      </div>
    );
  }

  const textColor = getTextColorForBg(punteggio.colore);
  
  // Configurazione Taglie (classi Tailwind)
  const sizeConfig = {
    xs: {
      container: "p-0.5 rounded shadow-sm",
      gap: "gap-1",
      iconWrapper: "w-4 h-4", // Forza dimensioni icona piccola
      text: "text-[0.6rem]",
      value: "text-xs"
    },
    s: {
      container: "p-1 rounded-md shadow-sm",
      gap: "gap-1.5",
      iconWrapper: "w-6 h-6",
      text: "text-xs",
      value: "text-sm"
    },
    m: { // Default (corrisponde al tuo originale)
      container: "p-2 rounded-lg shadow-inner",
      gap: "gap-2",
      iconWrapper: "w-8 h-8", // Dimensione media standard
      text: "text-base",
      value: "text-xl"
    },
    l: {
      container: "p-3 rounded-xl shadow-md",
      gap: "gap-3",
      iconWrapper: "w-12 h-12",
      text: "text-lg",
      value: "text-2xl"
    },
    xl: {
      container: "p-4 rounded-2xl shadow-lg",
      gap: "gap-4",
      iconWrapper: "w-16 h-16",
      text: "text-2xl",
      value: "text-4xl"
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.m;

  let textToShow = "";
  if (displayText === "abbr") {
    textToShow = punteggio.sigla ? punteggio.sigla.toUpperCase() : "";
  } else if (displayText === "name") {
    textToShow = punteggio.nome;
  }

  let iconHtml = "";
  if (iconType === "inv_circle") {
    iconHtml = punteggio.icona_cerchio_inverted_html;
  } else if (iconType === "circle") {
    iconHtml = punteggio.icona_cerchio_html;
  } else if (iconType === "raw") {
    iconHtml = punteggio.icona_html;
  }

  return (
    <div 
      className={`flex items-center justify-between ${currentSize.container}`}
      style={{ backgroundColor: punteggio.colore }}
    >
      <div className={`flex items-center ${currentSize.gap}`}>
        {/* Icona */}
        {iconHtml && iconType !== "none" && (
          <div 
            className={`flex items-center justify-center ${currentSize.iconWrapper}`}
            dangerouslySetInnerHTML={{ __html: iconHtml }} 
            /* Nota: l'SVG interno dovrebbe adattarsi al contenitore (w/h-full) o avere viewbox corretta */
          />
        )}
        
        {/* Testo */}
        {textToShow && (
          <span 
            className={`font-bold capitalize ${currentSize.text}`}
            style={{ color: textColor }}
          >
            {textToShow}
          </span>
        )}
      </div>
      
      {/* Valore */}
      {value !== undefined && (
        <span 
          className={`font-bold ${currentSize.value}`}
          style={{ color: textColor }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default PunteggioDisplay;