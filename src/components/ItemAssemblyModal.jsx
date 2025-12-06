import React, { useState, useEffect, useMemo } from 'react';
import { X, Wrench, Send, ShieldAlert, Cpu, UserCheck, Loader2, Coins, GraduationCap, Trash2 } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { assemblaOggetto, smontaOggetto, validateAssembly, createAssemblyRequest, getCapableArtisans } from '../api'; 

const ItemAssemblyModal = ({ hostItem, inventory, onClose, onRefresh }) => {
  const { selectedCharacterData } = useCharacter();
  
  // --- STATI ---
  const [mode, setMode] = useState('INSTALL'); // 'INSTALL' o 'REMOVE'
  const [selectedMod, setSelectedMod] = useState(null); // Oggetto selezionato
  
  // Stati validazione
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(null);
  const [capableArtisans, setCapableArtisans] = useState([]);
  const [isLoadingArtisans, setIsLoadingArtisans] = useState(false);
  
  // Input Utente
  const [selectedTarget, setSelectedTarget] = useState(''); 
  const [offerCredits, setOfferCredits] = useState(0);
  
  // Loading e Feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtro oggetti installabili (Zaino)
  const compatibleItems = useMemo(() => {
    return inventory.filter(item => {
        if (item.id === hostItem.id) return false;
        const isTechHost = hostItem.is_tecnologico;
        // Host Tecnologico -> accetta MOD
        if (isTechHost && item.tipo_oggetto === 'MOD') return true;
        // Host Mondano -> accetta MATERIA
        if (!isTechHost && item.tipo_oggetto === 'MAT') return true;
        return false;
    });
  }, [inventory, hostItem]);

  // Lista oggetti già installati (per rimozione)
  const installedMods = hostItem.potenziamenti_installati || [];

  // Reset parziale quando cambia selezione
  useEffect(() => {
    setValidationData(null);
    setCapableArtisans([]);
    setSelectedTarget('');
    setError(null);
    setSuccess(null);
  }, [selectedMod, mode]);

  // --- VALIDAZIONE AUTOMATICA ---
  useEffect(() => {
    if (!selectedMod || !selectedCharacterData) return;

    const runChecks = async () => {
      setIsValidating(true);
      setIsLoadingArtisans(true);
      
      try {
        // 1. Verifica le mie competenze
        const valData = await validateAssembly(selectedCharacterData.id, hostItem.id, selectedMod.id);
        setValidationData(valData);

        // 2. Se non ho skill, cerco chi può farlo (Artigiani)
        if (valData && !valData.can_assemble_self) {
            const artisans = await getCapableArtisans(selectedCharacterData.id, hostItem.id, selectedMod.id);
            setCapableArtisans(artisans || []);
        }
      } catch (err) {
        console.error("Errore controlli:", err);
      } finally {
        setIsValidating(false);
        setIsLoadingArtisans(false);
      }
    };

    const timer = setTimeout(runChecks, 500);
    return () => clearTimeout(timer);
  }, [selectedMod, hostItem, selectedCharacterData]);

  // --- HANDLERS SELEZIONE ---
  const handleSelectInstalled = (mod) => {
      if (selectedMod?.id === mod.id && mode === 'REMOVE') {
          setSelectedMod(null);
          setMode('INSTALL');
      } else {
          setMode('REMOVE');
          setSelectedMod(mod);
      }
  };

  const handleSelectInventory = (e) => {
      const modId = e.target.value;
      if (!modId) {
          setSelectedMod(null);
          return;
      }
      const item = compatibleItems.find(i => i.id == modId);
      setMode('INSTALL');
      setSelectedMod(item);
  };

  // --- AZIONE PRINCIPALE (Esecuzione Diretta o Accademia) ---
  const handleExecuteAction = async () => {
    if (!selectedMod) return;
    
    const isAcademy = selectedTarget === 'ACADEMY';
    setIsProcessing(true);
    setError(null);

    try {
        if (mode === 'INSTALL') {
            await assemblaOggetto(hostItem.id, selectedMod.id, selectedCharacterData.id, isAcademy);
            setSuccess(isAcademy ? "Installato via Accademia!" : "Installazione completata!");
        } else {
            await smontaOggetto(hostItem.id, selectedMod.id, selectedCharacterData.id, isAcademy);
            setSuccess(isAcademy ? "Smontato via Accademia!" : "Smontaggio completato!");
        }
        
        setTimeout(() => { onRefresh(); onClose(); }, 1500);
    } catch (err) {
        setError(err.message || "Operazione fallita.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- AZIONE RICHIESTA ESTERNA (Giocatore) ---
  const handleSendRequest = async () => {
      // Determina il tipo operazione
      const opType = mode === 'REMOVE' ? 'RIMO' : 'INST';
      const opLabel = mode === 'REMOVE' ? 'smontaggio' : 'assemblaggio';
      
      const artisanObj = capableArtisans.find(a => a.id.toString() === selectedTarget);
      if (!artisanObj) {
          setError("Devi selezionare un artigiano dalla lista.");
          return;
      }

      setIsProcessing(true);
      try {
          await createAssemblyRequest(
              selectedCharacterData.id, 
              hostItem.id, 
              selectedMod.id, 
              artisanObj.nome, 
              offerCredits,
              opType // Passa 'RIMO' o 'INST' al backend
          );
          setSuccess(`Richiesta di ${opLabel} inviata a ${artisanObj.nome}!`);
          setTimeout(() => { onClose(); }, 2000);
      } catch (err) {
          setError(err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* HEADER */}
        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center rounded-t-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" size={20}/>
                Gestione Moduli: <span className="text-amber-100">{hostItem.nome}</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-5 overflow-y-auto grow space-y-6">
            
            {/* LISTA MOD INSTALLATE (Per Smontaggio) */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Moduli Installati</h4>
                <div className="space-y-2">
                    {installedMods.length === 0 ? (
                        <div className="text-gray-500 text-sm italic bg-gray-900/30 p-2 rounded text-center">Nessun modulo installato.</div>
                    ) : (
                        installedMods.map(mod => (
                            <div 
                                key={mod.id}
                                onClick={() => handleSelectInstalled(mod)}
                                className={`
                                    flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all
                                    ${mode === 'REMOVE' && selectedMod?.id === mod.id 
                                        ? 'bg-red-900/30 border-red-500 ring-1 ring-red-500' 
                                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700'}
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <Cpu size={16} className="text-cyan-400"/>
                                    <span className="text-white font-medium">{mod.nome}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {mode === 'REMOVE' && selectedMod?.id === mod.id ? (
                                        <span className="text-red-300 font-bold flex items-center gap-1">
                                            <Trash2 size={12}/> Selezionato per Rimozione
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Clicca per smontare</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-gray-700"></div>

            {/* SELEZIONE PER INSTALLAZIONE */}
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Installa Nuovo Modulo</label>
                <select 
                    className={`w-full bg-gray-900 border text-white rounded-lg p-3 outline-none transition-all
                        ${mode === 'INSTALL' && selectedMod ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-600'}
                    `}
                    onChange={handleSelectInventory}
                    value={mode === 'INSTALL' && selectedMod ? selectedMod.id : ''}
                >
                    <option value="">-- Seleziona dallo Zaino --</option>
                    {compatibleItems.map(item => (
                        <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                </select>
            </div>

            {/* BOX DI CONTROLLO E AZIONE */}
            {selectedMod && validationData && (
                <div className={`rounded-lg p-4 border animate-fadeIn ${mode === 'REMOVE' ? 'bg-red-900/10 border-red-800/50' : 'bg-emerald-900/10 border-emerald-800/50'}`}>
                    
                    <h4 className={`font-bold mb-3 flex items-center gap-2 ${mode === 'REMOVE' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {mode === 'REMOVE' ? <Trash2 size={18}/> : <Wrench size={18}/>}
                        {mode === 'REMOVE' ? 'Smontaggio:' : 'Assemblaggio:'} {selectedMod.nome}
                    </h4>

                    {/* Check Skill */}
                    {validationData.can_assemble_self ? (
                        <div className="text-gray-300 text-sm mb-4 flex gap-2">
                            <UserCheck className="text-emerald-500" size={18}/>
                            <span>Hai le competenze necessarie.</span>
                        </div>
                    ) : (
                        <div className="text-amber-400 text-sm mb-4 flex gap-2 items-start">
                            <ShieldAlert className="shrink-0 mt-0.5" size={18}/>
                            <span>
                                {validationData.reason_self || "Competenze insufficienti."}
                            </span>
                        </div>
                    )}

                    {/* Selezione Esecutore (Se non ho skill) */}
                    {!validationData.can_assemble_self && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-400 mb-1">Chi esegue il lavoro?</label>
                            <select 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm"
                                value={selectedTarget}
                                onChange={(e) => setSelectedTarget(e.target.value)}
                            >
                                <option value="">-- Seleziona Opzione --</option>
                                <option value="ACADEMY" className="text-yellow-400 font-bold">
                                    🏛️ Accademia (100 CR) - Immediato
                                </option>
                                
                                {/* Mostra SEMPRE i giocatori se disponibili, anche per SMONTARE */}
                                {capableArtisans.length > 0 && (
                                    <optgroup label="Giocatori Disponibili">
                                        {capableArtisans.map(a => (
                                            <option key={a.id} value={a.id}>{a.nome}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                    )}

                    {/* PULSANTI AZIONE */}
                    <div className="flex gap-2">
                        {/* 1. ESECUZIONE DIRETTA (Skill o Accademia) */}
                        {(validationData.can_assemble_self || selectedTarget === 'ACADEMY') ? (
                            <button 
                                onClick={handleExecuteAction}
                                disabled={isProcessing}
                                className={`flex-1 text-white py-2 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg transition-all
                                    ${selectedTarget === 'ACADEMY' 
                                        ? 'bg-yellow-700 hover:bg-yellow-600' 
                                        : (mode === 'REMOVE' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500')}
                                `}
                            >
                                {isProcessing ? <Loader2 className="animate-spin"/> : (selectedTarget === 'ACADEMY' ? <Coins size={18}/> : <Wrench size={18}/>)}
                                {selectedTarget === 'ACADEMY' ? 'Paga 100 CR ed Esegui' : (mode === 'REMOVE' ? 'Smonta Ora' : 'Installa Ora')}
                            </button>
                        ) : (
                            /* 2. RICHIESTA GIOCATORE */
                            <>
                                {selectedTarget && selectedTarget !== 'ACADEMY' && (
                                    <div className="relative flex-1">
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