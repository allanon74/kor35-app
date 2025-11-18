// src/components/PunteggioDisplay.jsx

import React from 'react';

// Funzione helper per il contrasto (l'avevamo già)
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
 * * @param {object} punteggio - L'oggetto Punteggio completo dal context
 * @param {string|number} [value] - Il valore numerico da mostrare (es. "10")
 * @param {string} [displayText="abbr"] - Cosa mostrare: "abbr", "name", o "none"
 * @param {string} [iconType="inv_circle"] - Icona: "inv_circle", "circle", "raw", o "none"
 */
const PunteggioDisplay = ({ punteggio, value, displayText = "abbr", iconType = "inv_circle" }) => {
  
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
  
  let textToShow = "";
  if (displayText === "abbr") {
    textToShow = punteggio.sigla.toUpperCase();
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
      className="flex items-center justify-between p-2 rounded-lg shadow-inner"
      style={{ backgroundColor: punteggio.colore }}
    >
      <div className="flex items-center gap-2">
        {/* Icona */}
        {iconHtml && (
          <div dangerouslySetInnerHTML={{ __html: iconHtml }} />
        )}
        
        {/* Testo */}
        {textToShow && (
          <span 
            className="font-bold capitalize"
            style={{ color: textColor }}
          >
            {textToShow}
          </span>
        )}
      </div>
      
      {/* Valore */}
      {value !== undefined && (
        <span 
          className="text-xl font-bold"
          style={{ color: textColor }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default PunteggioDisplay;