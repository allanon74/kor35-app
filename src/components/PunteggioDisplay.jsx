import React, { useState } from 'react';
import IconaPunteggio, { getContrastColor } from './IconaPunteggio';
import { useCharacter } from './CharacterContext';
import ModelloAuraSelectionModal from './ModelloAuraSelectionModal';
import { AlertTriangle } from 'lucide-react';

const PunteggioDisplay = ({ 
  punteggio, 
  value, 
  displayText = "abbr", 
  iconType = "inv_circle", 
  size = "m",
  className = ""
}) => {
  const { selectedCharacterData } = useCharacter();
  const [showModal, setShowModal] = useState(false);
  
  if (!punteggio || !punteggio.colore) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-gray-700 rounded-lg ${className}`}>
        <span className="text-[10px] font-semibold text-gray-400">N/A</span>
      </div>
    );
  }

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
    xs: { gap: 'gap-1',    text: 'text-[9px]',     val: 'text-[10px]', p: 'p-0.5' },
    s:  { gap: 'gap-1.5',  text: 'text-[11px]',    val: 'text-xs',     p: 'p-1' },
    m:  { gap: 'gap-2.5',  text: 'text-sm',        val: 'text-lg',     p: 'p-1.5' },
    l:  { gap: 'gap-3.5',  text: 'text-base',      val: 'text-2xl',    p: 'p-2.5' },
    xl: { gap: 'gap-4',    text: 'text-xl',        val: 'text-4xl',    p: 'p-4' },
  };
  
  const layout = layoutConfig[size] || layoutConfig.m;
  const url = punteggio.icona_url || punteggio.icona;

  // --- LOGICA MODELLI AURA ---
  const isAura = punteggio.tipo === 'AU';
  const hasModelsAvailable = punteggio.has_models; // Campo booleano dal backend
  const userValue = parseInt(value) || 0;
  
  // Cerchiamo se il PG ha un modello associato a questa aura
  // Nota: Richiede che il backend (PersonaggioDetailSerializer) restituisca 'modelli_aura' con campo 'aura'
  const selectedModelName = isAura && selectedCharacterData?.modelli_aura
      ? selectedCharacterData.modelli_aura.find(m => m.aura === punteggio.id)?.nome 
      : null;

  // Mostriamo il pulsante se: è Aura, PG ha punteggio > 0, ci sono modelli disponibili, e non ne ha scelto uno
  const needsSelection = isAura && userValue > 0 && hasModelsAvailable && !selectedModelName;

  return (
    <>
        <div 
          className={`flex items-center justify-between rounded-lg shadow-sm transition-all ${layout.p} grow ${className}`}
          style={{ backgroundColor: punteggio.colore }}
        >
          <div className={`flex items-center ${layout.gap} grow min-w-0`}> 
            
            {/* Icona */}
            {iconMode && url && (
              <IconaPunteggio 
                url={url} 
                color={punteggio.colore} 
                mode={iconMode} 
                size={size}
                className="shrink-0" 
              />
            )}
            
            {/* Contenitore Testo + Info Modello */}
            <div className="flex flex-col min-w-0 justify-center">
                {textToShow && (
                  <span 
                    className={`font-bold uppercase tracking-wider ${layout.text} truncate whitespace-nowrap leading-tight`} 
                    style={{ color: textColor }}
                  >
                    {textToShow}
                  </span>
                )}

                {/* Caso 1: Serve Selezione */}
                {needsSelection && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                        className="mt-0.5 flex items-center gap-1 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse hover:bg-red-500 font-bold uppercase tracking-wider border border-white/20 shadow-sm w-max"
                    >
                        <AlertTriangle size={10} /> Scegli!
                    </button>
                )}

                {/* Caso 2: Modello già scelto */}
                {selectedModelName && (
                    <span 
                        className="text-[10px] opacity-90 font-mono uppercase tracking-tight block leading-none mt-0.5" 
                        style={{ color: textColor }}
                    >
                        {selectedModelName}
                    </span>
                )}
            </div>
          </div>
          
          {/* Valore Numerico */}
          {value !== undefined && (
            <span 
              className={`font-bold font-mono ${layout.val} shrink-0 ml-2 whitespace-nowrap`} 
              style={{ color: textColor }}
            >
              {value}
            </span>
          )}
        </div>

        {/* Modale Selezione (Renderizzata solo se serve) */}
        {showModal && (
            <ModelloAuraSelectionModal 
                aura={punteggio} 
                onClose={() => setShowModal(false)} 
            />
        )}
    </>
  );
};

export default PunteggioDisplay;