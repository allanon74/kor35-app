import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2 } from 'lucide-react';
import AbilitaDetailModal from './AbilitaDetailModal.jsx'; // Da creare
import { acquireAbilita } from '../api.js'; // Da creare

// Funzione helper per unire classi
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Componente helper per la lista (riutilizzabile)
const SkillList = ({ skills, openModal, actionButton }) => (
  <ul className="divide-y divide-gray-700">
    {skills.map((skill) => (
      <li key={skill.id} className="p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{skill.nome}</h3>
          <p className="text-sm text-gray-400">
            {skill.costo_pc} PC / {skill.costo_crediti} Crediti
          </p>
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
    selectedCharacterData: char,
    masterSkillsList,
    isLoadingSkills,
    isLoadingDetail,
    refreshCharacterData,
  } = useCharacter();
  
  const [modalSkill, setModalSkill] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null); // Salva l'ID dell'abilità

  const handleOpenModal = (skillId) => {
    // Troviamo sempre i dati completi dalla master list
    const fullSkill = masterSkillsList.find(s => s.id === skillId);
    setModalSkill(fullSkill || null);
  };

  const handleAcquire = async (skill) => {
    if (isAcquiring) return;
    
    if (!window.confirm(`Sei sicuro di voler acquisire "${skill.nome}" per ${skill.costo_pc} PC e ${skill.costo_crediti} Crediti?`)) {
      return;
    }
    
    setIsAcquiring(skill.id);
    try {
      await acquireAbilita(skill.id, onLogout);
      await refreshCharacterData(); // Forza l'aggiornamento del personaggio!
    } catch (error) {
      console.error("Errore acquisto:", error);
      alert(`Errore durante l'acquisto: ${error.message}`);
    } finally {
      setIsAcquiring(null);
    }
  };

  // Calcoliamo le liste solo quando i dati cambiano
  const { acquirableSkills, possessedSkills } = useMemo(() => {
    // Se il personaggio o la lista master non sono pronti, restituisci array vuoti
    if (!char || !masterSkillsList || masterSkillsList.length === 0) {
      return { acquirableSkills: [], possessedSkills: [] };
    }

    // Assicurati che 'abilita_possedute' esista prima di mapparlo
    const possessedSkillIds = new Set(
      (char.abilita_possedute || []).map(s => s.id)
    );
    const charScores = char.caratteristiche_base || {};

    const acquirable = masterSkillsList.filter(skill => {
      // Controllo di sicurezza: se 'skill' è nullo o incompleto, scartalo
      if (!skill || !skill.id) return false;
      
      // 1. Non già posseduta
      if (possessedSkillIds.has(skill.id)) return false;

      // 2. Requisiti Punteggio (Logica "TUTTI DEVONO ESSERE SODDISFATTI")
      const meetsReqs = (skill.requisiti || []).every(
        req => {
            // Se il requisito è malformato, ignoralo (non contare contro)
            if (!req || !req.requisito || !req.requisito.nome) return true; 
            // Altrimenti, controlla
            return (charScores[req.requisito.nome] || 0) >= req.valore;
        }
      );
      // Se anche un solo requisito fallisce, scarta l'abilità
      if (!meetsReqs) return false;

      // 3. Prerequisiti Abilità (Logica "TUTTI DEVONO ESSERE SODDISFATTI")
      const meetsPrereqs = (skill.prerequisiti || []).every(
        pre => {
            // Se il prerequisito è malformato, ignoralo
            if (!pre || !pre.prerequisito || !pre.prerequisito.id) return true;
            // Altrimenti, controlla
            return possessedSkillIds.has(pre.prerequisito.id);
        }
      );
      // Se anche un solo prerequisito fallisce, scarta l'abilità
      if (!meetsPrereqs) return false;

      // Se l'abilità ha superato tutti i controlli (non posseduta, reqs OK, prereqs OK)
      return true;
    });

    // Cerca di mappare le abilità possedute ai dati completi della master list
    const possessed = (char.abilita_possedute || []).map(possessedSkill => {
        const fullSkillData = masterSkillsList.find(ms => ms.id === possessedSkill.id);
        return fullSkillData || possessedSkill; // Usa i dati completi se li troviamo
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
    const canAffordPC = char.punti_caratteristica >= skill.costo_pc;
    const canAffordCrediti = char.crediti >= skill.costo_crediti;
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
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1">
            <Tab className={({ selected }) => classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
            )}>
              Acquista ({acquirableSkills.length})
            </Tab>
            <Tab className={({ selected }) => classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
            )}>
              Possedute ({possessedSkills.length})
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <SkillList 
                skills={acquirableSkills} 
                openModal={(s) => handleOpenModal(s.id)}
                actionButton={AcquirableActionButton}
              />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <SkillList 
                skills={possessedSkills} 
                openModal={(s) => handleOpenModal(s.id)}
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