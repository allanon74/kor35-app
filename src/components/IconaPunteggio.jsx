import React from 'react';
import { API_BASE_URL } from '../api';

// Helper per il contrasto
const getContrastColor = (hexColor) => {
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

const IconaPunteggio = ({ url, color = '#000000', mode = 'normal', size = 'm', className = '' }) => {
  if (!url) return <span className="text-xs text-red-500">No URL</span>;

  // 1. Costruzione URL
  let fullUrl = url;
  if (!url.startsWith('http')) {
      // Pulisce eventuali doppi slash //
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const path = url.startsWith('/') ? url : `/${url}`;
      fullUrl = `${baseUrl}${path}`;
  }

  // 2. LOG DI DEBUG (Guarda la console del browser - F12)
  // Decommenta la riga sotto se vuoi vedere ogni singolo URL processato
  // console.log(`[Icona] Caricamento: ${fullUrl} | Mode: ${mode} | Color: ${color}`);

  const contrastColor = getContrastColor(color);

  // Mappa Dimensioni
  const sizeMap = {
    xs: 'w-5 h-5', s: 'w-8 h-8', m: 'w-12 h-12', l: 'w-20 h-20', xl: 'w-32 h-32',
  };
  const iconSizeMap = {
    xs: 'w-3 h-3', s: 'w-5 h-5', m: 'w-7 h-7', l: 'w-12 h-12', xl: 'w-20 h-20',
  };

  const containerSize = sizeMap[size] || sizeMap.m;
  const iconSize = iconSizeMap[size] || iconSizeMap.m;

  let containerBg = 'transparent';
  let iconFill = color; 
  let borderRadius = '0';
  let isRaw = (mode === 'raw');

  if (mode === 'normal') {
      iconFill = color;
  } else if (mode === 'cerchio') {
      containerBg = contrastColor === 'white' ? '#1f2937' : '#f3f4f6';
      iconFill = color;
      borderRadius = '50%';
  } else if (mode === 'cerchio_inv') {
      containerBg = color;
      iconFill = contrastColor;
      borderRadius = '50%';
  }

  // Funzione per gestire errore di caricamento
  const handleError = (e) => {
    console.error(`[Icona] ERRORE CARICAMENTO: ${fullUrl}`);
    e.target.style.display = 'none'; // Nasconde l'immagine rotta
  };

  // --- MODALITÀ RAW (Immagine Semplice) ---
  if (isRaw) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${containerSize} ${className} border border-dashed border-gray-600`}>
         <img 
            src={fullUrl} 
            alt="icon-raw" 
            className="w-full h-full object-contain" 
            onError={handleError}
         />
      </div>
    );
  }

  // --- MODALITÀ COLORATA (CSS Drop-Shadow) ---
  return (
    <div 
      className={`flex items-center justify-center shrink-0 shadow-sm ${containerSize} ${className}`}
      style={{ backgroundColor: containerBg, borderRadius, position: 'relative' }}
    >
      {/* DEBUG: Se decommenti la riga sotto, vedrai l'immagine originale "vera" in piccolo 
         sopra a quella colorata. Utile per capire se l'immagine viene caricata.
      */}
      {/* <img src={fullUrl} className="absolute top-0 left-0 w-2 h-2 z-50 border border-red-500" /> */}

      <div className={`${iconSize} relative overflow-hidden`}>
         <img 
            src={fullUrl} 
            alt="" 
            className="w-full h-full object-contain"
            style={{
               position: 'relative',
               left: '-100px', // Sposta l'originale fuori
               filter: `drop-shadow(100px 0 0 ${iconFill})` // Proietta l'ombra colorata dentro
            }}
            onError={handleError}
         />
      </div>
    </div>
  );
};

export default IconaPunteggio;