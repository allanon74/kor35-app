import React, { useState, Fragment, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api';
import { Loader2, ShoppingCart, Info, PlusCircle, Users, BookOpen, ChevronRight } from 'lucide-react';
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

  const ccoValue = useMemo(() => char?.statistiche?.find(s => s.sigla === 'CCO')?.valore || 0, [char]);
  const proposteCerimoniali = char?.proposte_tecniche?.filter(p => p.tipo === 'CER') || [];

  // Raggruppamento e Filtro Acquisto: Livello <= Min(CCO, Aura PG)
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
    if (!window.confirm(`Vuoi apprendere "${cerimoniale.nome}"? Costo: ${cerimoniale.costo_crediti} CR`)) return;
    setIsBuying(cerimoniale.id);
    try {
        await fetchAuthenticated('/personaggi/api/personaggio/me/acquisisci_cerimoniale/', onLogout, {
            method: 'POST',
            body: JSON.stringify({ personaggio_id: selectedCharacterId, cerimoniale_id: cerimoniale.id })
        });
        await refreshCharacterData();
    } catch (error) { alert(error.message); } 
    finally { setIsBuying(null); }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700 bg-gray-800 shadow-md shrink-0">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2"><Users size={22}/> Cerimoniali V2</h2>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Gestione riti e narrazione corale</p>
            </div>
            <div className="text-right">
                <span className="text-[9px] uppercase text-gray-500 block font-bold">Coralità (CCO)</span>
                <span className="text-lg font-black text-purple-300">{ccoValue}</span>
            </div>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 m-2 shrink-0">
          {['Posseduti', 'Nuovi Cerimoniali', 'Proposte'].map((category) => (
            <Tab as={Fragment} key={category}>
              {({ selected }) => (
                <button className={`w-full rounded-lg py-2.5 text-xs font-black uppercase tracking-tighter transition-all ${selected ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                  {category}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="flex-1 overflow-y-auto p-2 pb-20">
          <Tab.Panel className="space-y-3 animate-in fade-in">
            {char?.cerimoniali_posseduti?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-600 italic"><BookOpen size={30} className="mb-2 opacity-20"/><p>Ancora nessun rito appreso.</p></div>
            ) : (
                char?.cerimoniali_posseduti?.map(cer => (
                    <div key={cer.id} onClick={() => setSelectedCerimoniale(cer)} className="bg-gray-800 p-3 rounded-lg border-l-4 border-purple-600 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                        <div>
                            <h3 className="font-bold text-gray-200">{cer.nome}</h3>
                            <span className="text-[10px] text-purple-400 font-bold uppercase">Livello {cer.livello} • {cer.aura_richiesta_nome}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-600" />
                    </div>
                ))
            )}
          </Tab.Panel>

          <Tab.Panel className="space-y-6 animate-in fade-in">
            {Object.keys(groupedAcquirable).length === 0 ? (
                <div className="p-10 text-center text-gray-500 italic text-sm">Nessun cerimoniale disponibile per i tuoi requisiti attuali.</div>
            ) : (
                Object.entries(groupedAcquirable).map(([aura, lista]) => (
                    <div key={aura} className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-500 px-2 border-l-2 border-purple-500 ml-1">{aura}</h3>
                        <div className="space-y-3">
                            {lista.sort((a,b) => a.livello - b.livello).map(cer => (
                                <div key={cer.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{cer.nome}</h3>
                                            <span className="text-xs text-purple-300 font-bold">Livello {cer.livello}</span>
                                        </div>
                                        <button onClick={() => setSelectedCerimoniale(cer)} className="text-gray-500 hover:text-white p-1 transition-colors"><Info size={20}/></button>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                                        <span className="text-md font-black text-yellow-500">{cer.costo_crediti} CR</span>
                                        <button onClick={() => handlePurchase(cer)} disabled={isBuying === cer.id || char.crediti < cer.costo_crediti} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 disabled:bg-gray-700 transition-all active:scale-95">
                                            {isBuying === cer.id ? <Loader2 className="animate-spin" size={14}/> : <ShoppingCart size={14}/>}
                                            {char.crediti < cer.costo_crediti ? 'Insufficiente' : 'Apprendi'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
          </Tab.Panel>

          <Tab.Panel className="space-y-4 animate-in fade-in">
            <button onClick={() => setShowProposalModal(true)} className="w-full py-6 bg-gray-800 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 hover:text-purple-400 hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-2 mb-4 group">
                <PlusCircle size={32} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-[10px] uppercase tracking-widest">Proponi Nuovo Cerimoniale</span>
            </button>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* MODALE DETTAGLIO */}
      {selectedCerimoniale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedCerimoniale(null)}>
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="p-5 border-b border-gray-800 flex justify-between items-start bg-gray-800/50 rounded-t-2xl">
                <div>
                    <h3 className="text-xl font-black text-purple-400 uppercase tracking-tight">{selectedCerimoniale.nome}</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Livello {selectedCerimoniale.livello} • {selectedCerimoniale.aura_richiesta_nome}</p>
                </div>
                <button onClick={() => setSelectedCerimoniale(null)} className="text-gray-400 hover:text-white transition-colors text-xl">✕</button>
             </div>
             <div className="p-6 overflow-y-auto space-y-6 text-sm">
                <div><h4 className="text-[10px] font-black text-purple-500 uppercase mb-2">Prerequisiti</h4><p className="text-gray-300 pl-3 border-l border-gray-700 italic">{selectedCerimoniale.prerequisiti}</p></div>
                <div><h4 className="text-[10px] font-black text-gray-500 uppercase mb-2">Svolgimento</h4><div className="text-gray-300 whitespace-pre-wrap">{selectedCerimoniale.svolgimento}</div></div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20"><h4 className="text-[10px] font-black text-purple-300 uppercase mb-2">Effetto</h4><div className="text-gray-200 leading-relaxed">{selectedCerimoniale.effetto}</div></div>
             </div>
             <div className="p-4 border-t border-gray-800 bg-gray-800/30 rounded-b-2xl flex justify-end"><button onClick={() => setSelectedCerimoniale(null)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-black uppercase transition-colors">Chiudi</button></div>
          </div>
        </div>
      )}

      {showProposalModal && <ProposalEditorModal proposal={null} type="Cerimoniale" onClose={() => setShowProposalModal(false)} onRefresh={refreshCharacterData} />}
    </div>
  );
};

export default CerimonialiTab;