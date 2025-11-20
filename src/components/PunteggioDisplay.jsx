import React from 'react';
// Importiamo sia il componente default che la funzione named export
import IconaPunteggio, { getContrastColor } from './IconaPunteggio';

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

  // USIAMO LA FUNZIONE CONDIVISA (che usa /255 e funziona)
  const textColor = getContrastColor(punteggio.colore);
  
  let iconMode = 'cerchio_inv';
  if (iconType === 'circle') iconMode = 'cerchio';
  if (iconType === 'raw') iconMode = 'raw'; 
  if (iconType === 'inv_circle') iconMode = 'cerchio_inv'; 
  if (iconType === 'none') iconMode = null;

  let textToShow = "";
  if (displayText === "abbr") {
    textToShow = punteggio.sigla ? punteggio.sigla.toUpperCase() : punteggio.nome;
  } else if (displayText === "name") {
    textToShow = punteggio.nome;
  }

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
      className={`flex items-center justify-between rounded-lg shadow-sm transition-all ${layout.p} grow ${className}`}
      style={{ backgroundColor: punteggio.colore }}
    >
      <div className={`flex items-center ${layout.gap} grow min-w-0`}> 
        
        {iconMode && url && (
          <IconaPunteggio 
            url={url} 
            color={punteggio.colore} 
            mode={iconMode} 
            size={size}
            className="shrink-0" 
          />
        )}
        
        {textToShow && (
          <span 
            className={`font-bold uppercase tracking-wider ${layout.text} truncate whitespace-nowrap`} 
            style={{ color: textColor }}
          >
            {textToShow}
          </span>
        )}
      </div>
      
      {value !== undefined && (
        <span 
          className={`font-bold font-mono ${layout.val} shrink-0 ml-2 whitespace-nowrap`} 
          style={{ color: textColor }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default PunteggioDisplay;