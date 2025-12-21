import React, { useState } from 'react';
import { useCharacter } from './CharacterContext'; // <--- IMPORT CORRETTO
import ProposalEditorModal from './ProposalEditorModal';
import { Users, BookOpen, Plus } from 'lucide-react';

const CerimonialiTab = () => {
  const { selectedCharacterData, acquirableCerimoniali, refreshCharacterData } = useCharacter();
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedCerimoniale, setSelectedCerimoniale] = useState(null);

  // Recupera i cerimoniali posseduti dal personaggio (campo many-to-many nel DB)
  const posseduti = selectedCharacterData?.cerimoniali_posseduti || [];

  return (
    <div className="p-4 pb-24 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
          <Users size={24} /> Cerimoniali
        </h2>
      </div>

      {/* SEZIONE 1: I MIEI CERIMONIALI */}
      <div>
        <h3 className="text-sm text-gray-400 uppercase font-bold mb-3">Conosciuti</h3>
        <div className="space-y-3">
            {posseduti.length === 0 ? (
            <div className="bg-gray-800/50 p-4 rounded-lg text-center text-gray-500 italic border border-gray-700">
                <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
                Non conosci ancora nessun rito.
            </div>
            ) : (
            posseduti.map((cer) => (
                <div 
                key={cer.id} 
                onClick={() => setSelectedCerimoniale(cer)}
                className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-md active:scale-[0.98] transition-all cursor-pointer hover:border-purple-500"
                >
                <div className="flex justify-between items-start">
                    <div>
                    <h3 className="text-md font-bold text-gray-200">{cer.nome}</h3>
                    <div className="text-xs text-purple-300 mt-1">
                        Livello {cer.livello} • {cer.aura_richiesta_nome || 'Rituale'}
                    </div>
                    </div>
                </div>
                </div>
            ))
            )}
        </div>
      </div>

      {/* SEZIONE 2: ACQUISTABILI (Opzionale, se vuoi mostrare quelli imparabili) */}
      {acquirableCerimoniali.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h3 className="text-sm text-gray-400 uppercase font-bold mb-3">Disponibili per l'apprendimento</h3>
            <div className="space-y-2">
                {acquirableCerimoniali.map(cer => (
                    <div key={cer.id} className="opacity-75 bg-gray-900 border border-gray-800 p-2 rounded flex justify-between items-center">
                        <span className="text-gray-400 text-sm">{cer.nome} (Lv.{cer.livello})</span>
                        {/* Qui potresti mettere un tasto "Acquista" se gestito via API */}
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* BOTTONE PROPOSTA */}
      <button
        onClick={() => setShowProposalModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-900/50 flex items-center justify-center z-30 active:scale-90 transition-transform"
      >
        <Plus size={28} />
      </button>

      {/* MODALE DETTAGLIO */}
      {selectedCerimoniale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCerimoniale(null)}>
          <div className="bg-gray-900 border border-purple-500 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedCerimoniale(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
             
             <h3 className="text-2xl font-bold text-purple-400 mb-1">{selectedCerimoniale.nome}</h3>
             <div className="text-sm text-gray-400 mb-6 flex justify-between border-b border-gray-800 pb-2">
                <span>Livello {selectedCerimoniale.livello}</span>
                <span>{selectedCerimoniale.aura_richiesta_nome}</span>
             </div>

             <div className="space-y-5 text-gray-300 text-sm leading-relaxed">
                {selectedCerimoniale.prerequisiti && (
                    <div className="bg-gray-800/30 p-3 rounded border-l-2 border-purple-500">
                        <strong className="text-purple-300 block mb-1 uppercase text-xs">Prerequisiti Narrativi</strong> 
                        {selectedCerimoniale.prerequisiti}
                    </div>
                )}
                {selectedCerimoniale.svolgimento && (
                    <div>
                        <strong className="text-white block mb-1 uppercase text-xs">Svolgimento</strong> 
                        {selectedCerimoniale.svolgimento}
                    </div>
                )}
                {selectedCerimoniale.effetto && (
                    <div>
                        <strong className="text-white block mb-1 uppercase text-xs">Effetto</strong> 
                        {selectedCerimoniale.effetto}
                    </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODALE CREAZIONE PROPOSTA */}
      {showProposalModal && (
        <ProposalEditorModal
          proposal={null} // Nuova proposta
          type="Cerimoniale" // Passa il tipo stringa corretto
          onClose={() => setShowProposalModal(false)}
          onRefresh={refreshCharacterData}
        />
      )}
    </div>
  );
};

export default CerimonialiTab;