import React from 'react';
import IconaPunteggio from './IconaPunteggio';

// Helper contrasto (mantenuto per il testo)
const getTextColorForBg = (hexColor) => {
  if (!hexColor) return 'white';
  try {
    const hex = hexColor.replace('#', ''); 
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminanza = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminanza > 0.5 ? 'black' : 'white';
  } catch (e) {
    return 'white';
  }
};

/**
 * Wrapper che usa IconaPunteggio e gestisce il layout con testo/valore.
 */
const PunteggioDisplay = ({ 
  punteggio, 
  value, 
  displayText = "abbr", 
  iconType = "inv_circle", // Manteniamo compatibilità nomi props
  size = "m",
  className = ""
}) => {
  
  if (!punteggio || !punteggio.colore) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-gray-700 rounded-lg ${className}`}>
        <span className="text-xs font-semibold text-gray-400">N/A</span>
      </div>
    );
  }

  const textColor = getTextColorForBg(punteggio.colore);
  
  // Mappatura IconType -> Mode
  let iconMode = 'cerchio_inv';
  if (iconType === 'circle') iconMode = 'cerchio';
  if (iconType === 'raw') iconMode = 'normal'; // 'raw' ora usa 'normal' per colorare l'icona senza sfondo
  if (iconType === 'none') iconMode = null;

  // Gestione Testo
  let textToShow = "";
  if (displayText === "abbr") {
    textToShow = punteggio.sigla ? punteggio.sigla.toUpperCase() : "";
  } else if (displayText === "name") {
    textToShow = punteggio.nome;
  }

  // Configurazione Layout (Spaziature e Font) in base alla taglia
  const layoutConfig = {
    xs: { gap: 'gap-1.5', text: 'text-[10px]', val: 'text-xs', p: 'p-1' },
    s:  { gap: 'gap-2',   text: 'text-xs',      val: 'text-sm', p: 'p-1.5' },
    m:  { gap: 'gap-3',   text: 'text-sm',      val: 'text-lg', p: 'p-2' },
    l:  { gap: 'gap-4',   text: 'text-base',    val: 'text-2xl', p: 'p-3' },
    xl: { gap: 'gap-5',   text: 'text-xl',      val: 'text-4xl', p: 'p-4' },
  };
  
  const layout = layoutConfig[size] || layoutConfig.m;

  // URL Icona (Preferiamo icona_url se c'è, o icona)
  const url = punteggio.icona_url || punteggio.icona;

  return (
    <div 
      className={`flex items-center justify-between rounded-lg shadow-sm transition-all ${layout.p} ${className}`}
      style={{ backgroundColor: punteggio.colore }}
    >
      <div className={`flex items-center ${layout.gap}`}>
        {/* Icona */}
        {iconMode && url && (
          <IconaPunteggio 
            url={url} 
            color={punteggio.colore} 
            mode={iconMode} 
            size={size}
          />
        )}
        
        {/* Testo (Nome/Sigla) */}
        {textToShow && (
          <span 
            className={`font-bold uppercase tracking-wider ${layout.text}`}
            style={{ color: textColor }}
          >
            {textToShow}
          </span>
        )}
      </div>
      
      {/* Valore Numerico */}
      {value !== undefined && (
        <span 
          className={`font-bold font-mono ${layout.val}`}
          style={{ color: textColor }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default PunteggioDisplay;