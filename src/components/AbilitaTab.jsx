import React, { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2, ShoppingCart, Info } from 'lucide-react'; 
import AbilitaDetailModal from './AbilitaDetailModal.jsx';
import { acquireAbilita } from '../api.js';
import GroupedSkillList from './GroupedSkillList'; // <--- IMPORT

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

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

  const handleOpenModal = (skill) => setModalSkill(skill);

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

  // --- RENDERERS ---

  // Renderer per i costi sotto il nome (Solo Mobile)
  const renderSubtitle = (skill) => {
     if (skill.costo_pc_calc > 0 || skill.costo_crediti_calc > 0) {
        return (
          <div className="text-xs text-gray-400 flex gap-2 mt-0.5 pl-8 sm:hidden">
              {skill.costo_pc_calc > 0 && <span>PC: {skill.costo_pc_calc}</span>}
              {skill.costo_crediti_calc > 0 && <span>CR: {skill.costo_crediti_calc}</span>}
          </div>
        );
     }
     return null;
  };

  // Bottoni per Tab Possedute
  const renderPossessedActions = (skill) => (
    <button
        onClick={() => handleOpenModal(skill)}
        className="p-2 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        title="Dettagli"
    >
        <Info size={20} />
    </button>
  );

  // Bottoni e Costi (Desktop) per Tab Acquista
  const renderAcquireActions = (skill) => {
    const canAffordPC = char.punti_caratteristica >= skill.costo_pc_calc;
    const canAffordCrediti = char.crediti >= skill.costo_crediti_calc;
    const canAfford = canAffordPC && canAffordCrediti;
    const isDiscounted = skill.costo_crediti > skill.costo_crediti_calc;
    
    return (
      <div className="flex items-center gap-3">
        {/* Display Costi (Desktop) */}
        <div className="flex flex-col items-end text-xs font-mono mr-2">
             {skill.costo_pc_calc > 0 && (
                 <span className={canAffordPC ? "text-blue-300" : "text-red-400 font-bold"}>
                    {skill.costo_pc_calc} PC
                 </span>
             )}

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
            {/* Tab Possedute */}
            <Tab.Panel className="focus:outline-none animate-fadeIn">
              <GroupedSkillList 
                skills={possessedSkills} 
                punteggiList={punteggiList}
                onItemClick={handleOpenModal}
                actionRenderer={renderPossessedActions}
                showDescription={false} // Niente descrizioni qui, come da richiesta
              />
            </Tab.Panel>
            
            {/* Tab Acquista */}
            <Tab.Panel className="focus:outline-none animate-fadeIn">
              <GroupedSkillList 
                skills={acquirableSkills} 
                punteggiList={punteggiList}
                onItemClick={handleOpenModal}
                actionRenderer={renderAcquireActions}
                renderSubtitle={renderSubtitle} // Passiamo il renderer per i costi mobile
                showDescription={false}
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