import React, { useState, Fragment, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2, ShoppingCart, Info } from 'lucide-react'; 
import AbilitaDetailModal from './AbilitaDetailModal.jsx';
import { acquireAbilita } from '../api.js';
import PunteggioDisplay from './PunteggioDisplay'; 

// Helper per unire classi
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Helper per il contrasto colore
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

// --- Componente Helper: Lista Raggruppata ---
const GroupedSkillList = ({ skills, punteggiList, onItemClick, actionRenderer }) => {
  
  const grouped = useMemo(() => {
    if (!skills) return {};
    
    // 1. Raggruppamento
    const groups = skills.reduce((acc, skill) => {
        let charName = "Altro";
        let charObj = null;
        let charId = null;

        // Determina Nome e ID base dal dato dell'abilità
        if (skill.caratteristica) {
            if (typeof skill.caratteristica === 'object') {
                charName = skill.caratteristica.nome;
                charId = skill.caratteristica.id;
                charObj = skill.caratteristica; 
            } else {
                if (typeof skill.caratteristica === 'number') {
                     charId = skill.caratteristica;
                     const p = punteggiList?.find(p => p.id === charId);
                     if (p) charName = p.nome;
                } else {
                     charName = String(skill.caratteristica);
                }
            }
        }

        // Cerca l'oggetto "ricco" nella lista globale punteggi
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

    // 2. Ordinamento Alfabetico (A-Z) per ogni gruppo
    Object.values(groups).forEach(group => {
        group.skills.sort((a, b) => a.nome.localeCompare(b.nome));
    });

    return groups;

  }, [skills, punteggiList]);

  if (!skills || skills.length === 0) {
    return <div className="p-8 text-gray-500 text-center italic">Nessuna abilità in questa lista.</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped)
        // Opzionale: Ordina anche le sezioni (Caratteristiche) alfabeticamente
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB)) 
        .map(([charName, group]) => {
        
        // Calcolo colori dinamici
        const headerBg = group.charData?.colore || '#374151'; 
        const headerText = getTextColorForBg(headerBg);
        
        return (
          <div 
            key={charName} 
            className="bg-gray-900/40 rounded-xl overflow-hidden shadow-sm"
            style={{ 
                border: `2px solid ${headerBg}` 
            }}
          >
            
            {/* Header Gruppo Dinamico */}
            <div 
                className="px-4 py-3 flex items-center border-b border-black/20"
                style={{ backgroundColor: headerBg }}
            >
               {group.charData && (
                   <div className="mr-4">
                      <PunteggioDisplay 
                          punteggio={group.charData} 
                          displayText="none" 
                          size="m" 
                          iconType="inv_circle"
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
            
            {/* Lista Abilità */}
            <ul className="divide-y divide-gray-700/50">
              {group.skills.map((skill) => (
                <li 
                  key={skill.id} 
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-800/60 transition-colors gap-3"
                >
                   {/* Parte Sinistra: Icona XS + Nome */}
                   <div 
                      className="flex items-center cursor-pointer grow" 
                      onClick={() => onItemClick(skill)}
                   >
                      <div className="mr-3 shrink-0">
                           {group.charData ? (
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

                      <div>
                          <span className="font-semibold text-gray-200 block text-base">{skill.nome}</span>
                          {/* Costi visibili solo in mobile o lista generica (solo se > 0) */}
                          {(skill.costo_pc_calc > 0 || skill.costo_crediti_calc > 0) && (
                              <div className="text-xs text-gray-400 flex gap-2 mt-0.5 sm:hidden">
                                  {skill.costo_pc_calc > 0 && <span>PC: {skill.costo_pc_calc}</span>}
                                  {skill.costo_crediti_calc > 0 && <span>CR: {skill.costo_crediti_calc}</span>}
                              </div>
                          )}
                      </div>
                   </div>
                   
                   {/* Parte Destra: Azioni */}
                   <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {actionRenderer && actionRenderer(skill)}
                   </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};


// --- Componente Principale ---
const AbilitaTab = ({ onLogout }) => {
  const {
    selectedCharacterData: char,
    selectedCharacterId, 
    acquirableSkills,     
    isLoadingAcquirable,  
    isLoadingDetail,
    refreshCharacterData,
    punteggiList 
  } = useCharacter();
  
  const [modalSkill, setModalSkill] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null);

  const handleOpenModal = (skill) => {
    setModalSkill(skill);
  };

  const handleAcquire = async (skill) => {
    if (isAcquiring || !selectedCharacterId) return;
    
    const pcCostString = skill.costo_pc_calc > 0 ? `${skill.costo_pc_calc} PC` : '';
    const creditCostString = skill.costo_crediti_calc > 0 ? `${skill.costo_crediti_calc} Crediti` : '';
    const joiner = pcCostString && creditCostString ? ' e ' : '';
    
    const confirmMessage = `Sei sicuro di voler acquisire "${skill.nome}" per ${pcCostString}${joiner}${creditCostString}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsAcquiring(skill.id);
    try {
      await acquireAbilita(skill.id, selectedCharacterId, onLogout);
      await refreshCharacterData(); 
    } catch (error) {
      console.error("Errore acquisto:", error);
      alert(`Errore durante l'acquisto: ${error.message}`);
    } finally {
      setIsAcquiring(null);
    }
  };

  const possessedSkills = char?.abilita_possedute || [];

  if (isLoadingAcquirable || isLoadingDetail || !char) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  const renderPossessedActions = (skill) => (
    <button
        onClick={() => handleOpenModal(skill)}
        className="p-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        title="Dettagli"
    >
        <Info size={20} />
    </button>
  );

  const renderAcquireActions = (skill) => {
    const canAffordPC = char.punti_caratteristica >= skill.costo_pc_calc;
    const canAffordCrediti = char.crediti >= skill.costo_crediti_calc;
    const canAfford = canAffordPC && canAffordCrediti;
    const isDiscounted = skill.costo_crediti > skill.costo_crediti_calc;
    
    return (
      <div className="flex items-center gap-3">
        {/* Display Costi Compatto con logica Sconto & Zero-Hiding */}
        <div className="flex flex-col items-end text-xs font-mono mr-2">
             
             {/* Costo PC (Mostra solo se > 0) */}
             {skill.costo_pc_calc > 0 && (
                 <span className={canAffordPC ? "text-blue-300" : "text-red-400 font-bold"}>
                    {skill.costo_pc_calc} PC
                 </span>
             )}

             {/* Costo Crediti (Mostra solo se > 0) */}
             {skill.costo_crediti_calc > 0 && (
                 isDiscounted ? (
                    <div className="flex flex-col items-end leading-none mt-1">
                        <span className="text-[10px] text-red-500 line-through decoration-red-500 opacity-80">
                            {skill.costo_crediti}
                        </span>
                        <span className="text-green-400 font-bold">
                            {skill.costo_crediti_calc} CR
                        </span>
                    </div>
                 ) : (
                    <span className={canAffordCrediti ? "text-yellow-300" : "text-red-400 font-bold"}>
                        {skill.costo_crediti_calc} CR
                    </span>
                 )
             )}
        </div>

        <button
          onClick={() => handleAcquire(skill)}
          disabled={!canAfford || isAcquiring === skill.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${
            !canAfford 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20'
          }`}
        >
          {isAcquiring === skill.id ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Acquista</span>
            </>
          )}
        </button>
        
        <button
            onClick={() => handleOpenModal(skill)}
            className="p-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
            <Info size={20} />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="w-full p-4 max-w-3xl mx-auto pb-24">
        
        {/* Riepilogo Valute */}
        <div className="mb-4 flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm">
            <div className="text-sm text-gray-400">Disponibilità:</div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1 text-blue-400 font-bold">
                    <span>{char.punti_caratteristica}</span> <span className="text-xs font-normal text-gray-400">PC</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <span>{char.crediti}</span> <span className="text-xs font-normal text-gray-400">CR</span>
                </div>
            </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800/80 p-1 mb-4 shadow-inner">
            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                    selected 
                        ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' 
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                )}>
                  Possedute <span className="ml-1 opacity-70 text-xs">({possessedSkills.length})</span>
                </button>
              )}
            </Tab>
            <Tab as={Fragment}>
               {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                    selected 
                        ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' 
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                )}>
                  Nuove <span className="ml-1 opacity-70 text-xs">({acquirableSkills.length})</span>
                </button>
               )}
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel className="focus:outline-none animate-fadeIn">
              <GroupedSkillList 
                skills={possessedSkills} 
                punteggiList={punteggiList}
                onItemClick={handleOpenModal}
                actionRenderer={renderPossessedActions}
              />
            </Tab.Panel>
            
            <Tab.Panel className="focus:outline-none animate-fadeIn">
              <GroupedSkillList 
                skills={acquirableSkills} 
                punteggiList={punteggiList}
                onItemClick={handleOpenModal}
                actionRenderer={renderAcquireActions}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      
      {modalSkill && (
        <AbilitaDetailModal
          skill={modalSkill}
          onClose={() => setModalSkill(null)}
          onLogout={onLogout}
          onPurchaseSuccess={() => {
             setModalSkill(null);
             refreshCharacterData();
          }}
        />
      )}
    </>
  );
};

export default AbilitaTab;
