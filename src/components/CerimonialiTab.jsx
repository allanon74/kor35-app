import React, { useState, Fragment, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api';
import { Loader2, ShoppingCart, Info, PlusCircle, FileEdit, Users, BookOpen, ChevronRight } from 'lucide-react';
import ProposalEditorModal from './ProposalEditorModal';

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

  // Calcolo valore Coralità (CCO)
  const ccoValue = useMemo(() => {
    return char?.statistiche?.find(s => s.sigla === 'CCO')?.valore || 0;
  }, [char]);

  // Filtra le proposte di tipo 'CER'
  const proposteCerimoniali = char?.proposte_tecniche?.filter(p => p.tipo === 'CER') || [];

  // FILTRO E RAGGRUPPAMENTO ACQUISTABILI
  const groupedAcquirable = useMemo(() => {
    if (!acquirableCerimoniali) return {};
    
    const filtered = acquirableCerimoniali.filter(cer => {
        const auraScore = char?.punteggi_base?.[cer.aura_richiesta_nome] || 0;
        const limit = Math.min(ccoValue, auraScore);
        return cer.livello <= limit;
    });

    return filtered.reduce((acc, cer) => {
      const auraName = cer.aura_richiesta_nome || "Altre Aure";
      if (!acc[auraName]) acc[auraName] = [];
      acc[auraName].push(cer);
      return acc;
    }, {});
  }, [acquirableCerimoniali, char, ccoValue]);

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
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                    <Users className="drop-shadow-md" /> Cerimoniali
                </h2>
                <p className="text-xs text-gray-400 mt-1">Riti collaborativi e narrazione condivisa.</p>
            </div>
            <div className="text-right">
                <span className="text-[10px] uppercase text-gray-500 block">Coralità (CCO)</span>
                <span className="text-lg font-black text-purple-300">{ccoValue}</span>
            </div>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 m-2 shrink-0">
          {['Posseduti', 'Disponibili', 'Proposte'].map((category) => (
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
          
          {/* TAB 1: POSSEDUTI */}
          <Tab.Panel className="space-y-3 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            {char?.cerimoniali_posseduti?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic border-2 border-dashed border-gray-700 rounded-xl m-4">
                    <BookOpen size={32} className="mb-2 opacity-50"/>
                    <p>Non conosci ancora nessun cerimoniale.</p>
                </div>
            ) : (
                char?.cerimoniali_posseduti?.map(cer => (
                    <div key={cer.id} onClick={() => setSelectedCerimoniale(cer)} 
                         className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm active:scale-[0.99] transition-transform cursor-pointer flex justify-between items-center group overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>
                        <div className="pl-2">
                            <h3 className="font-bold text-gray-100">{cer.nome}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-500/30">
                                    Livello {cer.livello}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-semibold">{cer.aura_richiesta_nome}</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                ))
            )}
          </Tab.Panel>

          {/* TAB 2: DISPONIBILI (Layout Raggruppato) */}
          <Tab.Panel className="space-y-6 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            {Object.keys(groupedAcquirable).length === 0 ? (
                <div className="p-10 text-center text-gray-500 italic">
                    Nessun cerimoniale disponibile per i tuoi requisiti (CCO: {ccoValue}).
                </div>
            ) : (
                Object.entries(groupedAcquirable).map(([aura, lista]) => (
                    <div key={aura} className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-purple-500 px-2 border-l-2 border-purple-500 ml-1">
                            {aura}
                        </h3>
                        <div className="space-y-3">
                            {lista.sort((a,b) => a.livello - b.livello).map(cer => (
                                <div key={cer.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{cer.nome}</h3>
                                            <span className="text-xs text-purple-300 font-bold">Livello {cer.livello}</span>
                                        </div>
                                        <button onClick={() => setSelectedCerimoniale(cer)} className="text-gray-500 hover:text-white p-1 transition-colors">
                                            <Info size={20}/>
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {cer.componenti?.map((comp, idx) => (
                                            <span key={idx} className="text-[9px] px-2 py-0.5 bg-gray-900 rounded-full text-gray-400 border border-gray-700 font-bold">
                                                {comp.caratteristica?.nome || comp.caratteristica_nome}: {comp.valore}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">Costo</span>
                                            <span className="text-md font-black text-yellow-500">{cer.costo_crediti} CR</span>
                                        </div>
                                        <button
                                            onClick={() => handlePurchase(cer)}
                                            disabled={isBuying === cer.id || char.crediti < cer.costo_crediti}
                                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all
                                                ${char.crediti < cer.costo_crediti 
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 active:scale-95'
                                                }`}
                                        >
                                            {isBuying === cer.id ? <Loader2 className="animate-spin" size={14}/> : <ShoppingCart size={14}/>}
                                            {char.crediti < cer.costo_crediti ? 'Crediti Insufficienti' : 'Acquisisci'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
          </Tab.Panel>

          {/* TAB 3: PROPOSTE */}
          <Tab.Panel className="space-y-4 focus:outline-none animate-in fade-in slide-in-from-bottom-2">
            <button 
                onClick={() => setShowProposalModal(true)}
                className="w-full py-4 bg-gray-800 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 hover:text-purple-400 hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-2 mb-4 group"
            >
                <PlusCircle size={32} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Proponi Nuovo Rito</span>
            </button>

            <div className="space-y-2">
                {proposteCerimoniali.map(prop => (
                    <div key={prop.id} className="bg-gray-800 p-3 rounded-lg border-l-4 border-purple-500 shadow flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-200">{prop.nome}</h4>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded 
                                ${prop.stato === 'BOZZA' ? 'bg-gray-600 text-gray-300' : 
                                  prop.stato === 'VALUTAZIONE' ? 'bg-yellow-900/50 text-yellow-500' : 
                                  'bg-green-900/50 text-green-400'}`}>
                                {prop.stato.replace('_', ' ')}
                            </span>
                        </div>
                        <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-purple-300 transition-colors" 
                                onClick={() => {/* Qui potresti riaprire la modale in edit se necessario */}}>
                            <FileEdit size={16} />
                        </button>
                    </div>
                ))}
            </div>
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* MODALE DETTAGLIO */}
      {selectedCerimoniale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedCerimoniale(null)}>
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="p-5 border-b border-gray-800 flex justify-between items-start bg-gray-800/50 rounded-t-2xl">
                <div>
                    <h3 className="text-xl font-black text-purple-400 uppercase tracking-tight">{selectedCerimoniale.nome}</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
                        Livello {selectedCerimoniale.livello} • {selectedCerimoniale.aura_richiesta?.nome || selectedCerimoniale.aura_richiesta_nome}
                    </p>
                </div>
                <button onClick={() => setSelectedCerimoniale(null)} className="text-gray-500 hover:text-white transition-colors">✕</button>
             </div>
             <div className="p-6 overflow-y-auto space-y-6 text-sm">
                <div className="space-y-6">
                    {selectedCerimoniale.prerequisiti && (
                        <div>
                            <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <div className="w-1 h-3 bg-purple-500 rounded-full"></div> Prerequisiti
                            </h4>
                            <p className="text-gray-300 leading-relaxed pl-3 border-l border-gray-800 italic">{selectedCerimoniale.prerequisiti}</p>
                        </div>
                    )}
                    {selectedCerimoniale.svolgimento && (
                        <div>
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Svolgimento</h4> 
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedCerimoniale.svolgimento}</div>
                        </div>
                    )}
                    {selectedCerimoniale.effetto && (
                        <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
                            <h4 className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Effetto Rituale</h4> 
                            <div className="text-gray-200 leading-relaxed">{selectedCerimoniale.effetto}</div>
                        </div>
                    )}
                </div>
                {selectedCerimoniale.componenti?.length > 0 && (
                    <div className="pt-6 border-t border-gray-800">
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Mattoni del Rito</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedCerimoniale.componenti.map((c, i) => (
                                <div key={i} className="flex items-center bg-black/40 rounded-lg px-3 py-1.5 border border-gray-800">
                                    <span className="text-xs font-bold text-gray-400 mr-2">{c.caratteristica?.nome || c.caratteristica_nome}</span>
                                    <span className="text-xs font-black text-purple-400">{c.valore}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
             <div className="p-4 border-t border-gray-800 bg-gray-800/30 rounded-b-2xl flex justify-end">
                <button onClick={() => setSelectedCerimoniale(null)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-black uppercase transition-colors">Chiudi</button>
             </div>
          </div>
        </div>
      )}

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