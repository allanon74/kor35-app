import React, { useState, useEffect, useMemo } from 'react';
import { X, Wrench, Send, ShieldAlert, Cpu, UserCheck, Loader2, Coins, GraduationCap, Trash2 } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { validateAssembly, createAssemblyRequest, getCapableArtisans } from '../api'; 
import { useOptimisticAssembly } from '../hooks/useGameData';

const ItemAssemblyModal = ({ hostItem, inventory, onClose, onRefresh }) => {
  const { selectedCharacterData } = useCharacter();
  
  const [mode, setMode] = useState('INSTALL'); // 'INSTALL' o 'REMOVE'
  const [selectedMod, setSelectedMod] = useState(null); 
  
  // Stati validazione
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(null);
  const [capableArtisans, setCapableArtisans] = useState([]);
  const [isLoadingArtisans, setIsLoadingArtisans] = useState(false);
  
  // Input Utente
  const [selectedTarget, setSelectedTarget] = useState(''); 
  const [offerCredits, setOfferCredits] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- MUTATIONS OTTIMISTICHE ---
  const installMutation = useOptimisticAssembly('monta');
  const removeMutation = useOptimisticAssembly('smonta');

  // Filtro oggetti installabili (Zaino)
  const compatibleMods = useMemo(() => {
     if (mode !== 'INSTALL') return [];
     return inventory.filter(item => {
        if (item.is_equipaggiato) return false;
        if (!['MOD', 'MAT', 'PROG'].includes(item.tipo_oggetto)) return false;
        return true; 
     });
  }, [inventory, mode]);

  const installedMods = hostItem.potenziamenti_installati || [];

  // Reset selezione al cambio modalità
  useEffect(() => {
    setSelectedMod(null);
    setValidationData(null);
    setError(null);
    setSuccess(null);
  }, [mode]);

  // Validazione automatica
  useEffect(() => {
    if (selectedMod && selectedCharacterData) {
        setIsValidating(true);
        setValidationData(null);
        setCapableArtisans([]);
        
        validateAssembly(selectedCharacterData.id, hostItem.id, selectedMod.id)
            .then(data => {
                setValidationData(data);
                
                // Se serve un artigiano, caricali
                if (!data.can_do_self && (data.requires_artisan || data.requires_skill)) {
                    setIsLoadingArtisans(true);
                    getCapableArtisans(selectedCharacterData.id, hostItem.id, selectedMod.id, null)
                        .then(artisans => setCapableArtisans(artisans))
                        .finally(() => setIsLoadingArtisans(false));
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setIsValidating(false));
    }
  }, [selectedMod, hostItem.id, selectedCharacterData]);


  // --- HANDLERS OTTIMISTICI ---

  const handleInstall = () => {
     if (!selectedMod) return;
     setIsProcessing(true);
     
     // 1. Usa Mutation Ottimistica invece di API diretta
     installMutation.mutate(
        { 
           host_id: hostItem.id, 
           mod_id: selectedMod.id, 
           charId: selectedCharacterData.id,
           useAcademy: false 
        },
        {
            onSuccess: () => {
                setSuccess("Installazione completata!");
                setTimeout(() => {
                    onRefresh(); // Chiude la modale e aggiorna (opzionale con optimistic)
                }, 1000);
            },
            onError: (err) => {
                setError("Errore installazione: " + err.message);
                setIsProcessing(false);
            }
        }
     );
  };

  const handleRemove = () => {
     if (!selectedMod) return;
     if (!window.confirm("Rimuovere questo componente?")) return;

     setIsProcessing(true);
     
     // 1. Usa Mutation Ottimistica
     removeMutation.mutate(
        { 
           host_id: hostItem.id, 
           mod_id: selectedMod.id, 
           charId: selectedCharacterData.id,
           useAcademy: false
        },
        {
            onSuccess: () => {
                setSuccess("Componente rimosso!");
                setTimeout(() => {
                    onRefresh();
                }, 1000);
            },
            onError: (err) => {
                setError("Errore rimozione: " + err.message);
                setIsProcessing(false);
            }
        }
     );
  };

  const handleSendRequest = async () => {
     if (!selectedTarget) return;
     setIsProcessing(true);
     try {
        await createAssemblyRequest(
            selectedCharacterData.id, 
            hostItem.id, 
            selectedMod.id, 
            selectedTarget, 
            offerCredits,
            mode === 'INSTALL' ? 'INST' : 'RIMO'
        );
        setSuccess("Richiesta inviata con successo!");
        setTimeout(onClose, 2000);
     } catch (err) {
        setError(err.message);
     } finally {
        setIsProcessing(false);
     }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-500"/> Assemblaggio
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* HOST ITEM INFO */}
        <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex items-center gap-3">
             <div className="bg-gray-700 p-2 rounded">
                 <Cpu size={24} className="text-indigo-400"/>
             </div>
             <div>
                 <div className="text-xs text-gray-500 uppercase font-bold">Oggetto Ospite</div>
                 <div className="font-bold text-white">{hostItem.nome}</div>
             </div>
        </div>

        {/* TABS MODE */}
        <div className="flex border-b border-gray-700">
            <button 
                onClick={() => setMode('INSTALL')}
                className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${mode === 'INSTALL' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
            >
                Installa Mod
            </button>
            <button 
                onClick={() => setMode('REMOVE')}
                className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${mode === 'REMOVE' ? 'bg-red-900/50 text-red-200 border-b-2 border-red-500' : 'hover:bg-gray-800 text-gray-400'}`}
            >
                Rimuovi Mod
            </button>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* SELEZIONE MOD */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    {mode === 'INSTALL' ? 'Seleziona Componente da Zaino' : 'Seleziona Componente Installato'}
                </label>
                
                {mode === 'INSTALL' ? (
                    compatibleMods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {compatibleMods.map(mod => (
                                <button 
                                    key={mod.id} 
                                    onClick={() => setSelectedMod(mod)}
                                    className={`p-3 rounded border text-left flex justify-between items-center transition-all ${selectedMod?.id === mod.id ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <span className="font-bold text-sm text-gray-200">{mod.nome}</span>
                                    <span className="text-xs text-gray-500">{mod.tipo_oggetto_display}</span>
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 italic text-sm text-center py-4">Nessun componente compatibile nello zaino.</p>
                ) : (
                    installedMods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {installedMods.map(mod => (
                                <button 
                                    key={mod.id} 
                                    onClick={() => setSelectedMod(mod)}
                                    className={`p-3 rounded border text-left flex justify-between items-center transition-all ${selectedMod?.id === mod.id ? 'bg-red-900/20 border-red-500 ring-1 ring-red-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <span className="font-bold text-sm text-gray-200">{mod.nome}</span>
                                    <Trash2 size={16} className="text-red-400"/>
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 italic text-sm text-center py-4">Nessun componente installato su questo oggetto.</p>
                )}
            </div>

            {/* VALIDATION & ACTIONS */}
            {selectedMod && (
                <div className="animate-fadeIn space-y-4 border-t border-gray-700 pt-4">
                    
                    {/* INFO SELEZIONE */}
                    <div className="flex items-center gap-2 text-sm text-indigo-300 font-bold bg-indigo-900/20 p-2 rounded">
                        <Wrench size={16}/> 
                        {mode === 'INSTALL' ? `Installare ${selectedMod.nome}?` : `Rimuovere ${selectedMod.nome}?`}
                    </div>

                    {/* LOADING VALIDATION */}
                    {isValidating && <div className="text-center py-2"><Loader2 className="animate-spin inline text-indigo-400"/> <span className="text-xs text-gray-400">Verifica compatibilità...</span></div>}

                    {/* VALIDATION RESULT */}
                    {!isValidating && validationData && (
                        <div className={`text-sm p-3 rounded border ${validationData.is_valid ? 'bg-green-900/10 border-green-800' : 'bg-red-900/10 border-red-800'}`}>
                             {validationData.is_valid ? (
                                <div className="text-green-400 flex items-center gap-2">
                                    <Shield size={16}/> Compatibilità confermata.
                                </div>
                             ) : (
                                <div className="text-red-400 flex items-center gap-2">
                                    <ShieldAlert size={16}/> {validationData.error_message || "Non compatibile."}
                                </div>
                             )}

                             {/* Requisiti Skill */}
                             {validationData.requires_skill && (
                                <div className="mt-2 text-xs text-gray-400">
                                    Richiede abilità: <span className="text-white font-bold">{validationData.required_skill_name}</span>
                                    {validationData.can_do_self ? (
                                        <span className="text-green-500 ml-2">(Posseduta)</span>
                                    ) : (
                                        <span className="text-red-500 ml-2">(Mancante)</span>
                                    )}
                                </div>
                             )}
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2 items-center">
                        {/* Fai da te */}
                        {validationData?.can_do_self && (
                            <button 
                                onClick={mode === 'INSTALL' ? handleInstall : handleRemove}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="animate-spin"/> : <Wrench size={18}/>}
                                {mode === 'INSTALL' ? 'Procedi (Fai da te)' : 'Smonta (Fai da te)'}
                            </button>
                        )}
                        
                        {/* Accademia */}
                        {validationData?.can_use_academy && mode === 'INSTALL' && (
                            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2">
                                <GraduationCap size={18}/> Accademia
                            </button>
                        )}
                    </div>

                    {/* RICHIESTA ARTIGIANO */}
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Richiedi a Tecnico</h4>
                        
                        {isLoadingArtisans ? (
                            <div className="text-center py-2"><Loader2 className="animate-spin inline"/></div>
                        ) : capableArtisans.length === 0 && !validationData?.can_do_self ? (
                            <p className="text-red-400 text-xs">Nessun tecnico disponibile online.</p>
                        ) : (
                            <>
                                <select 
                                    className="w-full bg-gray-900 text-white border border-gray-600 rounded p-2 mb-2 text-sm"
                                    value={selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                >
                                    <option value="">-- Seleziona Tecnico --</option>
                                    {capableArtisans.map(a => (
                                        <option key={a.id} value={a.id}>{a.nome} (Liv {a.livello_tecnico})</option>
                                    ))}
                                </select>
                                {selectedTarget && (
                                    <div className="flex gap-2 mb-2">
                                        <div className="bg-gray-900 border border-gray-600 rounded px-3 flex items-center text-yellow-500">
                                            <Coins size={16}/>
                                        </div>
                                        <input 
                                            type="number" placeholder="Offerta CR"
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 pl-2 text-white h-full"
                                            value={offerCredits} onChange={e=>setOfferCredits(e.target.value)}
                                        />
                                    </div>
                                )}
                                <button 
                                    onClick={handleSendRequest}
                                    disabled={isProcessing || !selectedTarget}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={18}/> Richiedi
                                </button>
                            </>
                        )}
                    </div>

                </div>
            )}

            {/* Feedback */}
            {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm flex items-center gap-2"><ShieldAlert size={16}/> {error}</div>}
            {success && <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded text-emerald-200 text-sm font-bold text-center">{success}</div>}

        </div>
      </div>
    </div>
  );
};

export default ItemAssemblyModal;