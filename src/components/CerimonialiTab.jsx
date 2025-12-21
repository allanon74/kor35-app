import React, { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api';
import { Loader2, ShoppingCart, Info, CheckCircle2, PlusCircle, FileEdit, Users, BookOpen } from 'lucide-react';
import ProposalEditorModal from './ProposalEditorModal';
import ProposalManager from './ProposalManager'; // Assicurati di avere questo componente o usa una lista semplificata

const CerimonialiTab = ({ onLogout }) => {
  const { 
    selectedCharacterData: char, 
    selectedCharacterId,
    acquirableCerimoniali, 
    refreshCharacterData 
  } = useCharacter();

  const [isBuying, setIsBuying] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedCerimoniale, setSelectedCerimoniale] = useState(null);

  // Filtra le proposte di tipo 'CER'
  const proposteCerimoniali = char?.proposte_tecniche?.filter(p => p.tipo === 'CER') || [];

  const handlePurchase = async (cerimoniale) => {
    if (!window.confirm(`Vuoi davvero apprendere "${cerimoniale.nome}" per ${cerimoniale.costo_crediti} crediti?`)) return;
    
    setIsBuying(cerimoniale.id);
    try {
        await fetchAuthenticated('/personaggi/api/personaggio/me/acquisisci_cerimoniale/', onLogout, {
            method: 'POST',
            body: JSON.stringify({ 
                personaggio_id: selectedCharacterId,
                cerimoniale_id: cerimoniale.id
            })
        });
        await refreshCharacterData();
        alert(`Hai appreso: ${cerimoniale.nome}!`);
    } catch (error) {
        alert(error.message || "Errore durante l'acquisto.");
    } finally {
        setIsBuying(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      
      {/* HEADER */}
      <div className="p-4 border-b border-gray-700 bg-gray-800 shadow-md shrink-0">
        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
          <Users className="drop-shadow-md" /> Cerimoniali
        </h2>
        <p className="text-xs text-gray-400 mt-1">Riti collaborativi e narrazione condivisa.</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 m-2 shrink-0">
          {['Posseduti', 'Disponibili', 'Creazione'].map((category) => (
            <Tab as={Fragment} key={category}>
              {({ selected }) => (
                <button
                  className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                    ${selected 
                      ? 'bg-purple-600 text-white shadow shadow-purple-900/50' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {category}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="flex-1 overflow-y-auto p-2 pb-20">
          
          {/* --- TAB 1: POSSEDUTI --- */}
          <Tab.Panel className="space-y-3 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            {char?.cerimoniali_posseduti?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic border-2 border-dashed border-gray-700 rounded-xl m-4">
                    <BookOpen size={32} className="mb-2 opacity-50"/>
                    <p>Non conosci ancora nessun cerimoniale.</p>
                </div>
            ) : (
                char?.cerimoniali_posseduti?.map(cer => (
                    <div key={cer.id} onClick={() => setSelectedCerimoniale(cer)} 
                         className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-purple-500/20"></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-bold text-gray-100 text-lg">{cer.nome}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-500/30">
                                        Livello {cer.livello}
                                    </span>
                                    <span className="text-xs text-gray-400">{cer.aura_richiesta_nome}</span>
                                </div>
                            </div>
                            <Info size={18} className="text-gray-500" />
                        </div>
                    </div>
                ))
            )}
          </Tab.Panel>

          {/* --- TAB 2: ACQUISTABILI --- */}
          <Tab.Panel className="space-y-3 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            {acquirableCerimoniali.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                    Nessun cerimoniale disponibile per i tuoi requisiti attuali.
                </div>
            ) : (
                acquirableCerimoniali.map(cer => (
                    <div key={cer.id} className="bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-md flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white">{cer.nome}</h3>
                                <span className="text-xs text-purple-300">Liv. {cer.livello} • {cer.aura_richiesta?.nome}</span>
                            </div>
                            <button onClick={() => setSelectedCerimoniale(cer)} className="text-gray-400 p-1"><Info size={20}/></button>
                        </div>
                        
                        {/* Mattoni/Requisiti */}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {cer.componenti?.map((comp, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 border border-gray-600">
                                    {comp.caratteristica?.nome || 'Caratteristica'}: {comp.valore}
                                </span>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center">
                            <span className="text-sm font-bold text-yellow-500">{cer.costo_crediti} CR</span>
                            <button
                                onClick={() => handlePurchase(cer)}
                                disabled={isBuying === cer.id || char.crediti < cer.costo_crediti}
                                className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors
                                    ${char.crediti < cer.costo_crediti 
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                                    }`}
                            >
                                {isBuying === cer.id ? <Loader2 className="animate-spin" size={14}/> : <ShoppingCart size={14}/>}
                                {char.crediti < cer.costo_crediti ? 'Crediti Insuff.' : 'Impara'}
                            </button>
                        </div>
                    </div>
                ))
            )}
          </Tab.Panel>

          {/* --- TAB 3: PROPOSTE --- */}
          <Tab.Panel className="space-y-4 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            <button 
                onClick={() => setShowProposalModal(true)}
                className="w-full py-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-purple-400 hover:border-purple-500 hover:bg-gray-700/50 transition-all flex flex-col items-center justify-center gap-2 mb-4"
            >
                <PlusCircle size={28} />
                <span className="font-bold text-sm uppercase tracking-wide">Proponi Nuovo Rito</span>
            </button>

            <div className="space-y-2">
                {proposteCerimoniali.map(prop => (
                    <div key={prop.id} className="bg-gray-800 p-3 rounded-lg border-l-4 border-purple-500 shadow flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-200">{prop.nome}</h4>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded 
                                ${prop.stato === 'BOZZA' ? 'bg-gray-600 text-gray-300' : 
                                  prop.stato === 'IN_VALUTAZIONE' ? 'bg-yellow-900/50 text-yellow-500' : 
                                  'bg-green-900/50 text-green-400'}`}>
                                {prop.stato.replace('_', ' ')}
                            </span>
                        </div>
                        <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-purple-300" 
                                onClick={() => {/* Qui potresti aprire l'editor in modalità modifica */}}>
                            <FileEdit size={16} />
                        </button>
                    </div>
                ))}
            </div>
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* --- MODALE DETTAGLIO --- */}
      {selectedCerimoniale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm p-safe" onClick={() => setSelectedCerimoniale(null)}>
          <div className="bg-gray-900 border border-purple-500 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             
             {/* Modal Header */}
             <div className="p-4 border-b border-gray-700 flex justify-between items-start bg-gray-800 rounded-t-xl">
                <div>
                    <h3 className="text-xl font-bold text-purple-400">{selectedCerimoniale.nome}</h3>
                    <p className="text-xs text-gray-400">Livello {selectedCerimoniale.livello} • {selectedCerimoniale.aura_richiesta?.nome || selectedCerimoniale.aura_richiesta_nome}</p>
                </div>
                <button onClick={() => setSelectedCerimoniale(null)} className="text-gray-400 hover:text-white p-1"><Users size={20}/></button>
             </div>

             {/* Modal Content */}
             <div className="p-5 overflow-y-auto space-y-4 text-sm text-gray-300 leading-relaxed">
                
                {/* Visualizzazione HTML dei campi di testo (come in Tessiture) */}
                <div className="space-y-4">
                    {selectedCerimoniale.prerequisiti && (
                        <div className="bg-gray-800/50 p-3 rounded border-l-2 border-purple-500">
                            <strong className="text-purple-300 block mb-1 uppercase text-[10px] tracking-widest">Prerequisiti</strong> 
                            {selectedCerimoniale.prerequisiti}
                        </div>
                    )}
                    
                    {selectedCerimoniale.svolgimento && (
                        <div>
                            <strong className="text-white block mb-1 uppercase text-[10px] tracking-widest border-b border-gray-700 pb-1 w-full">Svolgimento</strong> 
                            <div className="mt-2 text-gray-300">{selectedCerimoniale.svolgimento}</div>
                        </div>
                    )}
                    
                    {selectedCerimoniale.effetto && (
                        <div>
                            <strong className="text-white block mb-1 uppercase text-[10px] tracking-widest border-b border-gray-700 pb-1 w-full">Effetto</strong> 
                            <div className="mt-2 text-gray-300">{selectedCerimoniale.effetto}</div>
                        </div>
                    )}
                </div>

                {/* Componenti (Mattoni) */}
                {selectedCerimoniale.componenti && selectedCerimoniale.componenti.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-gray-700">
                        <strong className="text-gray-500 block mb-2 text-[10px] uppercase">Mattoni Richiesti</strong>
                        <div className="flex flex-wrap gap-2">
                            {selectedCerimoniale.componenti.map((c, i) => (
                                <div key={i} className="flex items-center bg-gray-800 rounded px-2 py-1 border border-gray-600">
                                    <span className="text-xs font-bold text-gray-300 mr-1">{c.caratteristica?.nome || c.caratteristica_nome}</span>
                                    <span className="text-xs bg-black/30 px-1 rounded text-purple-300">{c.valore}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-end">
                <button onClick={() => setSelectedCerimoniale(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold">Chiudi</button>
             </div>
          </div>
        </div>
      )}

      {/* --- MODALE CREAZIONE --- */}
      {showProposalModal && (
        <ProposalEditorModal
          proposal={null}
          type="Cerimoniale"
          onClose={() => setShowProposalModal(false)}
          onRefresh={refreshCharacterData}
        />
      )}
    </div>
  );
};

export default CerimonialiTab;