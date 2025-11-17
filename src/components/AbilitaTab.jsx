import React, { useState, useMemo, Fragment } from 'react'; // Aggiunto Fragment
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2 } from 'lucide-react';
import AbilitaDetailModal from './AbilitaDetailModal.jsx';
import { acquireAbilita } from '../api.js';
import { Decimal } from 'decimal.js'; // Importa per calcoli precisi

// Il parametro della statistica di sconto (dal tuo models.py)
const PARAMETRO_SCONTO_ABILITA = 'rid_cos_ab';

// Funzione helper per unire classi
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- Componente helper SkillList (MODIFICATO) ---
// Ora riceve i costi specifici da mostrare
const SkillList = ({ skills, openModal, actionButton, showCosts = false }) => (
  <ul className="divide-y divide-gray-700">
    {skills.map((skill) => (
      <li key={skill.id} className="p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{skill.nome}</h3>
          
          {/* --- MODIFICA: Costi Nascosti se Zero --- */}
          {showCosts && (skill.costo_pc_calc > 0 || skill.costo_crediti_calc > 0) && (
            <p className="text-sm text-gray-400">
              {skill.costo_pc_calc > 0 && (
                <span>{skill.costo_pc_calc} PC</span>
              )}
              {skill.costo_pc_calc > 0 && skill.costo_crediti_calc > 0 && (
                <span className="mx-1">/</span>
              )}
              {skill.costo_crediti_calc > 0 && (
                <span>
                  {/* Mostra il prezzo originale sbarrato se c'è uno sconto */}
                  {skill.costo_crediti_calc < skill.costo_crediti ? (
                    <>
                      <del className="text-red-400">{skill.costo_crediti}</del>
                      <span className="text-green-400 ml-1">{skill.costo_crediti_calc}</span>
                    </>
                  ) : (
                    <span>{skill.costo_crediti_calc}</span>
                  )} Crediti
                </span>
              )}
            </p>
          )}
          {/* --- FINE MODIFICA --- */}

        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal(skill)} // Passa l'intero oggetto skill
            className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
          >
            Dettagli
          </button>
          {actionButton && actionButton(skill)}
        </div>
      </li>
    ))}
  </ul>
);

const AbilitaTab = ({ onLogout }) => {
  const {
    selectedCharacterData: char,
    masterSkillsList,
    isLoadingSkills,
    isLoadingDetail,
    refreshCharacterData,
  } = useCharacter();
  
  const [modalSkill, setModalSkill] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null);

  const handleOpenModal = (skill) => {
    // Il 'skill' che riceviamo ha già i costi calcolati se viene
    // dalla lista "Acquista". Se viene da "Possedute", non li ha.
    // La modale gestirà entrambi i casi.
    setModalSkill(skill);
  };

  const handleAcquire = async (skill) => {
    if (isAcquiring) return;
    
    // Mostra il costo PC (se > 0) e il costo Crediti (se > 0)
    const pcCostString = skill.costo_pc_calc > 0 ? `${skill.costo_pc_calc} PC` : '';
    const creditCostString = skill.costo_crediti_calc > 0 ? `${skill.costo_crediti_calc} Crediti` : '';
    const joiner = pcCostString && creditCostString ? ' e ' : '';
    
    const confirmMessage = `Sei sicuro di voler acquisire "${skill.nome}" per ${pcCostString}${joiner}${creditCostString}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsAcquiring(skill.id);
    try {
      await acquireAbilita(skill.id, onLogout);
      await refreshCharacterData(); 
    } catch (error) {
      console.error("Errore acquisto:", error);
      alert(`Errore durante l'acquisto: ${error.message}`);
    } finally {
      setIsAcquiring(null);
    }
  };

  // Calcoliamo le liste solo quando i dati cambiano
  const { acquirableSkills, possessedSkills } = useMemo(() => {
    if (!char || !masterSkillsList || masterSkillsList.length === 0) {
      return { acquirableSkills: [], possessedSkills: [] };
    }

    const possessedSkillIds = new Set(
      (char.abilita_possedute || []).map(s => s.id)
    );
    const charScores = char.caratteristiche_base || {};
    
    // --- MODIFICA: Calcolo Sconto ---
    const mods = char.modificatori_calcolati || {};
    const sconto_stat = mods[PARAMETRO_SCONTO_ABILITA] || {add: 0, mol: 1.0};
    const sconto_valore = Math.max(0, sconto_stat.add || 0);
    const sconto_percent = new Decimal(sconto_valore).div(100);
    const moltiplicatore_costo = new Decimal(1).minus(sconto_percent);
    // --- FINE MODIFICA ---

    const acquirable = masterSkillsList
      .filter(skill => {
        if (!skill || !skill.id) return false;
        if (possessedSkillIds.has(skill.id)) return false;

        const meetsReqs = (skill.requisiti || []).every(
          req => (charScores[req.requisito.nome] || 0) >= req.valore
        );
        if (!meetsReqs) return false;

        const meetsPrereqs = (skill.prerequisiti || []).every(
          pre => possessedSkillIds.has(pre.prerequisito.id)
        );
        if (!meetsPrereqs) return false;

        return true;
      })
      .map(skill => {
        // Aggiungi i costi calcolati all'oggetto skill
        const costo_crediti_calc = new Decimal(skill.costo_crediti)
                                    .times(moltiplicatore_costo)
                                    .toDecimalPlaces(2) // Arrotonda a 2 decimali
                                    .toNumber();
        
        return {
          ...skill,
          costo_pc_calc: skill.costo_pc, // PC non è scontato
          costo_crediti_calc: costo_crediti_calc,
        };
      });

    const possessed = (char.abilita_possedute || []).map(possessedSkill => {
        // Arricchisci i dati dell'abilità posseduta con i dati completi dalla master list
        const fullSkillData = masterSkillsList.find(ms => ms.id === possessedSkill.id);
        return fullSkillData ? { ...fullSkillData, ...possessedSkill } : possessedSkill;
    });
    
    return { acquirableSkills: acquirable, possessedSkills: possessed };

  }, [char, masterSkillsList]);

  if (isLoadingSkills || isLoadingDetail || !char) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  const AcquirableActionButton = (skill) => {
    // Controlla usando i costi CALCOLATI
    const canAffordPC = char.punti_caratteristica >= skill.costo_pc_calc;
    const canAffordCrediti = char.crediti >= skill.costo_crediti_calc;
    const canAfford = canAffordPC && canAffordCrediti;
    
    return (
      <button
        onClick={() => handleAcquire(skill)}
        disabled={!canAfford || isAcquiring === skill.id}
        className={`px-3 py-1 text-sm rounded ${
          !canAfford 
            ? 'bg-red-800 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-500'
        } disabled:opacity-50`}
      >
        {isAcquiring === skill.id ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          'Acquista'
        )}
      </button>
    );
  };

  return (
    <>
      <div className="w-full p-4">
        <Tab.Group>
          {/* --- MODIFICA: ORDINE TAB --- */}
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1">
            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                    selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
                )}>
                  Possedute ({possessedSkills.length})
                </button>
              )}
            </Tab>
            <Tab as={Fragment}>
               {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                    selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
                )}>
                  Acquista ({acquirableSkills.length})
                </button>
               )}
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <SkillList 
                skills={possessedSkills} 
                openModal={handleOpenModal}
                showCosts={false} // Non mostrare i costi per le abilità possedute
              />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <SkillList 
                skills={acquirableSkills} 
                openModal={handleOpenModal}
                actionButton={AcquirableActionButton}
                showCosts={true} // Mostra i costi per le abilità da acquistare
              />
            </Tab.Panel>
          </Tab.Panels>
          {/* --- FINE MODIFICA ORDINE --- */}
        </Tab.Group>
      </div>
      
      {modalSkill && (
        <AbilitaDetailModal
          skill={modalSkill}
          onClose={() => setModalSkill(null)}
        />
      )}
    </>
  );
};

export default AbilitaTab;