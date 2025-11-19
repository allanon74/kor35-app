import React, { useMemo } from 'react';
import PunteggioDisplay from './PunteggioDisplay';

// Helper contrasto
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

const GroupedSkillList = ({ 
  skills, 
  punteggiList, 
  onItemClick, 
  actionRenderer, 
  renderSubtitle, 
  showDescription = false 
}) => {
  
  const { sortedSections } = useMemo(() => {
    if (!skills) return { sortedSections: [] };

    // 1. Raggruppamento
    const groups = skills.reduce((acc, skill) => {
      let charName = "Altro";
      let charObj = null;
      let charId = null;

      if (skill.caratteristica) {
        if (typeof skill.caratteristica === 'object') {
            charName = skill.caratteristica.nome;
            charId = skill.caratteristica.id;
            charObj = skill.caratteristica; 
        } else if (typeof skill.caratteristica === 'number') {
             charId = skill.caratteristica;
        } else {
             charName = String(skill.caratteristica);
        }
      }

      if (punteggiList && punteggiList.length > 0) {
        let found = null;
        if (charId) found = punteggiList.find(p => p.id === charId);
        if (!found && charName !== "Altro") found = punteggiList.find(p => p.nome === charName);
        
        if (found) {
            charObj = found;
            charName = found.nome;
        }
      }

      if (!acc[charName]) acc[charName] = { skills: [], charData: charObj };
      acc[charName].skills.push(skill);
      return acc;
    }, {});

    // 2. Ordinamento
    Object.values(groups).forEach(group => {
        group.skills.sort((a, b) => a.nome.localeCompare(b.nome));
    });

    const sections = [];
    const usedKeys = new Set();

    if (punteggiList) {
        punteggiList.forEach(p => {
            if (groups[p.nome]) {
                sections.push({ name: p.nome, ...groups[p.nome] });
                usedKeys.add(p.nome);
            }
        });
    }

    Object.keys(groups).sort().forEach(key => {
        if (!usedKeys.has(key)) {
            sections.push({ name: key, ...groups[key] });
        }
    });

    return { sortedSections: sections };
  }, [skills, punteggiList]);

  if (!skills || skills.length === 0) {
     return <p className="text-gray-500 bg-gray-800 p-4 rounded-lg text-center italic">Nessuna abilità trovata.</p>;
  }

  return (
    <div className="space-y-6">
      {sortedSections.map((group) => {
        const charName = group.name;
        const headerBg = group.charData?.colore || '#374151';
        const headerText = getTextColorForBg(headerBg);

        return (
            <div 
                key={charName} 
                className="bg-gray-900/40 rounded-xl overflow-hidden shadow-sm"
                style={{ border: `2px solid ${headerBg}` }}
            >
              {/* Header */}
              <div 
                  className="flex items-center px-4 py-3 border-b border-black/20"
                  style={{ backgroundColor: headerBg }}
              >
                 {group.charData && (
                     <div className="mr-4">
                        {/* Icona Grande nell'Header (Cerchio Invertito) */}
                        <PunteggioDisplay 
                            punteggio={group.charData} 
                            displayText="none" 
                            iconType="inv_circle" 
                            size="m" 
                        />
                     </div>
                 )}
                 <h4 
                    className="text-xl font-bold uppercase tracking-wider"
                    style={{ color: headerText }}
                 >
                    {charName}
                 </h4>
              </div>
              
              {/* Lista */}
              <ul className="divide-y divide-gray-700/50">
                {group.skills.map((skill) => (
                  <li 
                    key={skill.id} 
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-800/60 transition-colors gap-3"
                  >
                    {/* Parte Sinistra */}
                    <div 
                        className={`flex flex-col grow ${onItemClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onItemClick && onItemClick(skill)}
                    >
                        <div className="flex items-center">
                            <div className="mr-3 shrink-0">
                                {group.charData ? (
                                    // MODIFICA: Usa 'raw' che mappa a 'normal' (solo icona colorata)
                                    // Oppure usa 'inv_circle' se preferisci il pallino pieno.
                                    <PunteggioDisplay 
                                        punteggio={group.charData} 
                                        displayText="none" 
                                        size="xs" 
                                        iconType="raw" 
                                    />
                                ) : (
                                    <div className="w-4 h-4 bg-gray-600 rounded-full" />
                                )}
                            </div>
                            <span className="font-semibold text-gray-200 text-lg block">{skill.nome}</span>
                        </div>
                        
                        {renderSubtitle && renderSubtitle(skill)}
                        
                        {showDescription && skill.descrizione && (
                          <div
                            className="text-sm text-gray-400 pl-8 mt-1 prose prose-invert prose-sm"
                            dangerouslySetInnerHTML={{ __html: skill.descrizione }}
                          />
                        )}
                    </div>
                    
                    {actionRenderer && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-8 sm:ml-0">
                            {actionRenderer(skill)}
                        </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
        );
      })}
    </div>
  );
};

export default GroupedSkillList;