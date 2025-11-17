// src/components/AbilitaDetailModal.jsx

import React from 'react';
import { X } from 'lucide-react';
import { useCharacter } from './CharacterContext'; // <-- 1. IMPORTA useCharacter
import PunteggioDisplay from './PunteggioDisplay.jsx'; // <-- 2. IMPORTA PunteggioDisplay

// 3. RIMUOVI la vecchia funzione helper 'getTextColorForBg',
//    ora è gestita dentro PunteggioDisplay.


const AbilitaDetailModal = ({ skill, onClose }) => {
  if (!skill) return null;

  // 4. PRENDI la lista completa dei punteggi dal context
  const { punteggiList } = useCharacter();


// --- DEBUG ---
  // Logghiamo i dati che stiamo usando per il "find"
//   console.log("--- DEBUG POPUP ABILITÀ ---");
//   console.log("Oggetto 'skill' ricevuto:", skill);
//   console.log("Lista Punteggi (punteggiList):", punteggiList);
  // --- FINE DEBUG ---

  
  // 5. TROVA l'oggetto Punteggio completo usando l'ID
  //    (skill.caratteristica ha solo id, nome, sigla, colore)
  //    (punteggiList ha l'oggetto completo con le icone HTML)
  const caratteristicaPunteggio = punteggiList.find(
    p => p.id === skill.caratteristica.id
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Bottone Chiudi */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        {/* --- 6. SOSTITUISCI il vecchio div con il nuovo componente --- */}
        <div className="absolute top-4 right-16">
          <PunteggioDisplay
            punteggio={caratteristicaPunteggio} // Passa l'oggetto completo
            displayText="abbr"                 // Mostra la sigla (es. "FOR")
            iconType="inv_circle"              // Mostra l'icona invertita
            // (Nessun 'value' significa che mostrerà solo il badge)
          />
        </div>

        {/* Titolo */}
        <h2 className="text-2xl font-bold text-indigo-400 mb-4 pr-16">
          {skill.nome}
        </h2>
        
        {/* Descrizione (con HTML) */}
        {skill.descrizione ? (
          <div
            className="text-gray-300 mb-4 prose prose-invert"
            dangerouslySetInnerHTML={{ __html: skill.descrizione }}
          />
        ) : (
          <p className="text-gray-300 mb-4">
            <em>Nessuna descrizione.</em>
          </p>
        )}

        {/* Costi */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Costi</h3>
          <p className="text-gray-400">
            {skill.costo_pc} Punti Caratteristica
          </p>
          <p className="text-gray-400">
            {skill.costo_crediti} Crediti
          </p>
        </div>

        {/* Requisiti */}
        {skill.requisiti && skill.requisiti.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Requisiti</h3>
            <ul className="list-disc list-inside text-gray-400">
              {skill.requisiti.map(req => (
                <li key={req.requisito.nome}>
                  {req.requisito.nome}: {req.valore}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Prerequisiti */}
        {skill.prerequisiti && skill.prerequisiti.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Prerequisiti</h3>
            <ul className="list-disc list-inside text-gray-400">
              {skill.prerequisiti.map(pre => (
                <li key={pre.prerequisito.id}>
                  {pre.prerequisito.nome}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default AbilitaDetailModal;