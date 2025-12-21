import React, { useState } from 'react';
import { useGameData } from '../hooks/useGameData';
import ProposalEditorModal from './ProposalEditorModal';
import TecnicaDetailModal from './TecnicaDetailModal'; // Assumiamo esista o usiamo un modale generico

const CerimonialiTab = () => {
  const { data, loading, error, refreshData } = useGameData();
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedCerimoniale, setSelectedCerimoniale] = useState(null);

  if (loading) return <div className="p-4 text-center text-gray-400">Caricamento rituali...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Errore: {error}</div>;

  const cerimoniali = data?.cerimoniali_posseduti || [];

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-kor-gold border-b-2 border-kor-gold pb-1 w-full">
          <i className="fas fa-users-cog mr-2"></i>Cerimoniali
        </h2>
      </div>

      {/* Lista Cerimoniali Posseduti */}
      <div className="space-y-3">
        {cerimoniali.length === 0 ? (
          <div className="bg-gray-800/50 p-6 rounded-lg text-center text-gray-400 italic border border-gray-700">
            <i className="fas fa-book-open text-4xl mb-3 opacity-30 block"></i>
            Non conosci ancora nessun Cerimoniale.
          </div>
        ) : (
          cerimoniali.map((cer) => (
            <div 
              key={cer.id} 
              onClick={() => setSelectedCerimoniale(cer)}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-200">{cer.nome}</h3>
                  <div className="text-xs text-kor-gold mt-1">
                    {cer.aura_richiesta?.nome || 'Aura ???'} - Liv. {cer.livello}
                  </div>
                </div>
                {cer.icona && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                         {/* Gestione icona se presente */}
                         <i className="fas fa-scroll text-gray-400"></i>
                    </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottone Proposta */}
      <button
        onClick={() => setShowProposalModal(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-kor-gold text-black rounded-full shadow-lg shadow-kor-gold/20 flex items-center justify-center z-30 active:scale-90 transition-transform"
      >
        <i className="fas fa-plus text-xl"></i>
      </button>

      {/* Modale Dettaglio (Semplificato) */}
      {selectedCerimoniale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCerimoniale(null)}>
          <div className="bg-gray-900 border border-kor-gold rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedCerimoniale(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><i className="fas fa-times"></i></button>
             
             <h3 className="text-xl font-bold text-kor-gold mb-2">{selectedCerimoniale.nome}</h3>
             <div className="text-sm text-gray-400 mb-4 flex justify-between">
                <span>{selectedCerimoniale.aura_richiesta?.nome} (Lv.{selectedCerimoniale.livello})</span>
             </div>

             <div className="space-y-4 text-gray-300 text-sm">
                {selectedCerimoniale.prerequisiti && (
                    <div><strong className="text-white block mb-1">Prerequisiti:</strong> {selectedCerimoniale.prerequisiti}</div>
                )}
                {selectedCerimoniale.svolgimento && (
                    <div><strong className="text-white block mb-1">Svolgimento:</strong> {selectedCerimoniale.svolgimento}</div>
                )}
                {selectedCerimoniale.effetto && (
                    <div><strong className="text-white block mb-1">Effetto:</strong> {selectedCerimoniale.effetto}</div>
                )}
                
                 {/* Visualizza i costi in caratteristiche/mattoni se presenti */}
                 {selectedCerimoniale.componenti && selectedCerimoniale.componenti.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-gray-700">
                         <strong className="text-white block mb-2">Mattoni Richiesti:</strong>
                         <div className="flex flex-wrap gap-2">
                             {selectedCerimoniale.componenti.map((c, idx) => (
                                 <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-600">
                                     {c.caratteristica_nome}: {c.valore}
                                 </span>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
          </div>
        </div>
      )}

      {/* Modale Creazione Proposta */}
      {showProposalModal && (
        <ProposalEditorModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          initialType="CER" // TIPO_PROPOSTA_CERIMONIALE
          onSuccess={() => {
            setShowProposalModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default CerimonialiTab;