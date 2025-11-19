import React from 'react';

const API_BASE_URL = 'https://www.k-o-r-35.it';

// Helper per il contrasto (Bianco o Nero)
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

/**
 * Renderizza un'icona basandosi sull'URL e sul colore.
 * @param {string} url - URL relativo dell'icona (es. /media/...)
 * @param {string} color - Colore esadecimale (es. #FF0000)
 * @param {string} mode - 'raw' | 'normal' | 'cerchio' | 'cerchio_inv'
 * @param {string} size - 'xs' | 's' | 'm' | 'l' | 'xl'
 */
const IconaPunteggio = ({ url, color = '#000000', mode = 'normal', size = 'm', className = '' }) => {
  if (!url) return null;

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const contrastColor = getContrastColor(color);

  // Mappa Dimensioni (Container)
  const sizeMap = {
    xs: 'w-5 h-5',
    s:  'w-8 h-8',
    m:  'w-12 h-12',
    l:  'w-20 h-20',
    xl: 'w-32 h-32',
  };

  // Mappa Dimensioni (Icona interna)
  // Aggiustiamo leggermente l'icona interna per lasciare "aria" nel cerchio
  const iconSizeMap = {
    xs: 'w-3 h-3',
    s:  'w-5 h-5',
    m:  'w-7 h-7',
    l:  'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const containerSize = sizeMap[size] || sizeMap.m;
  const iconSize = iconSizeMap[size] || iconSizeMap.m;

  // --- Logica Modalità ---

  let containerStyle = {};
  let iconColor = 'black'; // Default per 'raw'
  
  if (mode === 'raw') {
      // Originale (Nero)
      return (
        <img 
          src={fullUrl} 
          alt="icon" 
          className={`${containerSize} object-contain ${className}`} 
        />
      );
  } else if (mode === 'normal') {
      // Icona colorata senza sfondo
      iconColor = color;
      containerStyle = { backgroundColor: 'transparent' }; // Nessun cerchio
  } else if (mode === 'cerchio') {
      // Cerchio (Bianco/Nero) con Icona colorata
      // Sfondo contrastante rispetto al colore dell'icona
      const bgColor = contrastColor === 'white' ? '#1f2937' : '#f3f4f6'; // Gray-800 o Gray-100
      containerStyle = { backgroundColor: bgColor, borderRadius: '50%' };
      iconColor = color;
  } else if (mode === 'cerchio_inv') {
      // Cerchio Colorato con Icona (Bianco/Nero)
      containerStyle = { backgroundColor: color, borderRadius: '50%' };
      iconColor = contrastColor;
  }

  // --- Rendering con CSS Mask ---
  // Usiamo mask-image per colorare l'icona SVG (che è trattata come una maschera per il div background)
  
  return (
    <div 
      className={`flex items-center justify-center shrink-0 shadow-sm ${containerSize} ${className}`}
      style={containerStyle}
    >
      <div 
        className={iconSize}
        style={{
          backgroundColor: iconColor,
          maskImage: `url("${fullUrl}")`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url("${fullUrl}")`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    </div>
  );
};

export default IconaPunteggio;