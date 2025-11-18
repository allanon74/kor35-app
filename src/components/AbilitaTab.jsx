import React, { useState, Fragment } from 'react'; // <-- Rimosso useMemo e Decimal
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2 } from 'lucide-react';
import AbilitaDetailModal from './AbilitaDetailModal.jsx';
import { acquireAbilita } from '../api.js';

// Rimosso: const PARAMETRO_SCONTO_ABILITA = 'rid_cos_ab';
// Il calcolo ora è fatto dal backend.

// Funzione helper per unire classi
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// --- Componente helper SkillList (INVARIATO) ---
// Questa componente era già scritta perfettamente per accettare
// i costi pre-calcolati (costo_pc_calc e costo_crediti_calc).
const SkillList = ({ skills, openModal, actionButton, showCosts = false }) => (
  <ul className="divide-y divide-gray-700">
    {skills.map((skill) => (
      <li key={skill.id} className="p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{skill.nome}</h3>
          
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

        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal(skill)}
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
    // --- MODIFICA: Usiamo i nuovi dati dal Context ---
    selectedCharacterData: char,
    selectedCharacterId, 
    acquirableSkills,     // <-- Nuovo
    isLoadingAcquirable,  // <-- Nuovo
    isLoadingDetail,
    refreshCharacterData,
    // Rimosso: masterSkillsList
    // Rimosso: isLoadingSkills
    // --- FINE MODIFICA ---
  } = useCharacter();
  
  const [modalSkill, setModalSkill] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null);

  const handleOpenModal = (skill) => {
    // I dati della skill sono già completi,
    // sia da 'possedute' (grazie alla modifica in serializers.py)
    // sia da 'acquistabili' (grazie alla new API view)
    setModalSkill(skill);
  };

  // --- FUNZIONE INVARIATA ---
  // Questa funzione è già corretta, perché usa
  // skill.costo_pc_calc e skill.costo_crediti_calc
  // che ora arrivano direttamente dal backend.
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

  // --- MODIFICA PRINCIPALE: useMemo RIMOSSO ---
  // Tutta la logica di calcolo scompare dal frontend.
  
  // I dati ora sono diretti:
  // 'abilita_possedute' ha i dati completi (dal PersonaggioDetailSerializer)
  const possessedSkills = char?.abilita_possedute || [];
  // 'acquirableSkills' arriva già filtrato e prezzato dal context (dalla nuova API)
  // ...ed è già disponibile dalla destrutturazione di useCharacter()

  // --- MODIFICA: Aggiornato lo stato di caricamento ---
  if (isLoadingAcquirable || isLoadingDetail || !char) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // --- FUNZIONE INVARIATA ---
  // Già corretta, usa i costi pre-calcolati
  const AcquirableActionButton = (skill) => {
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

  // --- JSX INVARIATO ---
  // Il JSX è già corretto, usa le variabili
  // 'possessedSkills' e 'acquirableSkills'
  return (
    <>
      <div className="w-full p-4">
        <Tab.Group>
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
                showCosts={false}
              />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <SkillList 
                skills={acquirableSkills} 
                openModal={handleOpenModal}
                actionButton={AcquirableActionButton}
                showCosts={true}
              />
            </Tab.Panel>
          </Tab.Panels>
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