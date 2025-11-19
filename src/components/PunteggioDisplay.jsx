import React from 'react';
import IconaPunteggio from './IconaPunteggio';

// Helper robusto anche qui (per il testo)
const getTextColorForBg = (hexColor) => {
  if (!hexColor) return 'white';
  try {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'white';
    const luminanza = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminanza > 0.5 ? 'black' : 'white';
  } catch (e) {
    return 'white';
  }
};

const PunteggioDisplay = ({ 
  punteggio, 
  value, 
  displayText = "abbr", 
  iconType = "inv_circle", 
  size = "m",
  className = ""
}) => {
  
  if (!punteggio || !punteggio.colore) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-gray-700 rounded-lg ${className}`}>
        <span className="text-[10px] font-semibold text-gray-400">N/A</span>
      </div>
    );
  }

  const textColor = getTextColorForBg(punteggio.colore);
  
  let iconMode = 'cerchio_inv';
  if (iconType === 'circle') iconMode = 'cerchio';
  if (iconType === 'raw') iconMode = 'raw'; 
  if (iconType === 'inv_circle') iconMode = 'cerchio_inv'; 
  if (iconType === 'none') iconMode = null;

  let textToShow = "";
  if (displayText === "abbr") {
    textToShow = punteggio.sigla ? punteggio.sigla.toUpperCase() : "";
  } else if (displayText === "name") {
    textToShow = punteggio.nome;
  }

  // --- LAYOUT AGGIORNATI (Dimensioni Intermedie) ---
  const layoutConfig = {
    xs: { gap: 'gap-1',    text: 'text-[9px]',    val: 'text-[10px]', p: 'p-0.5' },
    s:  { gap: 'gap-1.5',  text: 'text-[11px]',   val: 'text-xs',     p: 'p-1' },
    m:  { gap: 'gap-2.5',  text: 'text-sm',       val: 'text-lg',     p: 'p-1.5' },
    l:  { gap: 'gap-3.5',  text: 'text-base',     val: 'text-2xl',    p: 'p-2.5' },
    xl: { gap: 'gap-4',    text: 'text-xl',       val: 'text-4xl',    p: 'p-4' },
  };
  
  const layout = layoutConfig[size] || layoutConfig.m;
  const url = punteggio.icona_url || punteggio.icona;

  return (
    <div 
      className={`flex items-center justify-between rounded-lg shadow-sm transition-all ${layout.p} ${className}`}
      style={{ backgroundColor: punteggio.colore }}
    >
      <div className={`flex items-center ${layout.gap}`}>
        
        {/* Icona (se presente) */}
        {iconMode && url && (
          <IconaPunteggio 
            url={url} 
            color={punteggio.colore} 
            mode={iconMode} 
            size={size}
          />
        )}
        
        {/* Testo */}
        {textToShow && (
          <span 
            className={`font-bold uppercase tracking-wider ${layout.text}`}
            style={{ color: textColor }}
          >
            {textToShow}
          </span>
        )}
      </div>
      
      {/* Valore */}
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