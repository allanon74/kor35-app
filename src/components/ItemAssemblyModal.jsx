import React, { useState, useEffect, useMemo } from 'react';
import { X, Wrench, Send, ShieldAlert, Cpu, UserCheck, Loader2, Coins, GraduationCap, User } from 'lucide-react';
import { useCharacter } from './CharacterContext';
// Assicurati di importare la nuova funzione getCapableArtisans
import { assemblaOggetto, validateAssembly, createAssemblyRequest, getCapableArtisans } from '../api'; 

const ItemAssemblyModal = ({ hostItem, inventory, onClose, onRefresh }) => {
  const { selectedCharacterData } = useCharacter();
  
  // Stati selezione
  const [selectedModId, setSelectedModId] = useState('');
  const [selectedMod, setSelectedMod] = useState(null);
  
  // Stati validazione e Artigiani
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(null);
  const [capableArtisans, setCapableArtisans] = useState([]);
  const [isLoadingArtisans, setIsLoadingArtisans] = useState(false);
  
  // Stati Input Utente
  const [selectedTarget, setSelectedTarget] = useState(''); // Può essere ID artigiano o "ACADEMY"
  const [offerCredits, setOfferCredits] = useState(0);
  
  // Stati operazione
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Per assemblaggio diretto/accademia
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtro oggetti compatibili (come prima)
  const compatibleItems = useMemo(() => {
    return inventory.filter(item => {
        if (item.id === hostItem.id) return false;
        const isTechHost = hostItem.is_tecnologico;
        if (isTechHost && item.tipo_oggetto === 'MOD') return true;
        if (!isTechHost && item.tipo_oggetto === 'MAT') return true;
        return false;
    });
  }, [inventory, hostItem]);

  // Reset selezione quando cambia mod
  useEffect(() => {
    const item = compatibleItems.find(i => i.id == selectedModId);
    setSelectedMod(item || null);
    setValidationData(null);
    setCapableArtisans([]); // Reset lista artigiani
    setSelectedTarget('');
    setError(null);
    setSuccess(null);
  }, [selectedModId, compatibleItems]);

  // Validazione + Fetch Artigiani
  useEffect(() => {
    if (!selectedMod || !selectedCharacterData) return;

    const runChecks = async () => {
      setIsValidating(true);
      setIsLoadingArtisans(true);
      setError(null);
      
      try {
        // 1. Verifica se IO posso farlo
        const valData = await validateAssembly(selectedCharacterData.id, hostItem.id, selectedMod.id);
        setValidationData(valData);

        // 2. Se NON posso farlo, cerca chi può farlo
        if (valData && !valData.can_assemble_self) {
            const artisans = await getCapableArtisans(selectedCharacterData.id, hostItem.id, selectedMod.id);
            setCapableArtisans(artisans || []);
        }
      } catch (err) {
        console.error("Errore controlli:", err);
        setError("Errore durante la verifica dei requisiti.");
      } finally {
        setIsValidating(false);
        setIsLoadingArtisans(false);
      }
    };

    const timer = setTimeout(runChecks, 500);
    return () => clearTimeout(timer);
  }, [selectedMod, hostItem, selectedCharacterData]);

  // --- AZIONE: ASSEMBLA DA SOLO o TRAMITE ACCADEMIA ---
  const handleDirectAssembly = async () => {
    if (!selectedMod) return;
    
    // Distinguiamo se è un assemblaggio Skill Personale o Accademia
    const isAcademy = selectedTarget === 'ACADEMY';
    
    setIsLoading(true);
    try {
      // Passiamo il flag useAcademy (true se scelto Accademia)
      await assemblaOggetto(hostItem.id, selectedMod.id, selectedCharacterData.id, isAcademy);
      
      setSuccess(isAcademy ? "Lavoro completato dall'Accademia!" : "Oggetto assemblato con successo!");
      setTimeout(() => { onRefresh(); onClose(); }, 1500);
    } catch (err) {
      setError(err.message || "Errore durante l'assemblaggio.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- AZIONE: INVIA RICHIESTA ARTIGIANO ---
  const handleSendRequest = async () => {
    if (!selectedTarget || selectedTarget === 'ACADEMY') return;
    
    // Trova il nome dell'artigiano selezionato
    const artisanObj = capableArtisans.find(a => a.id.toString() === selectedTarget);
    if (!artisanObj) {
        setError("Artigiano non valido.");
        return;
    }

    setIsSendingRequest(true);
    try {
        await createAssemblyRequest(
            selectedCharacterData.id, 
            hostItem.id, 
            selectedMod.id, 
            artisanObj.nome, // Passiamo il nome come si aspetta la vecchia API, o l'ID se aggiorni il backend
            offerCredits
        );
        setSuccess(`Richiesta inviata a ${artisanObj.nome}!`);
        setTimeout(() => { onClose(); }, 2000);
    } catch (err) {
        setError(err.message || "Errore invio richiesta.");
    } finally {
        setIsSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* HEADER */}
        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center rounded-t-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" size={20}/>
                Assemblaggio: <span className="text-amber-100">{hostItem.nome}</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto grow space-y-6">
            
            {/* Info Host */}
            <div className="flex gap-4 items-center bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                <div className={`p-2 rounded-full ${hostItem.is_tecnologico ? 'bg-cyan-900/50 text-cyan-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                    {hostItem.is_tecnologico ? <Cpu size={24} /> : <UserCheck size={24} />}
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                        {hostItem.is_tecnologico ? 'Tecnologico' : 'Mondano'}
                    </p>
                    <p className="text-sm text-gray-200">
                        Componente Richiesto: <strong>{hostItem.is_tecnologico ? 'Mod' : 'Materia'}</strong>
                    </p>
                </div>
            </div>

            {/* Selezione Componente */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Seleziona Componente</label>
                <select 
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg p-3 focus:border-indigo-500 outline-none"
                    onChange={(e) => setSelectedModId(e.target.value)}
                    value={selectedModId}
                >
                    <option value="">-- Seleziona dallo Zaino --</option>
                    {compatibleItems.map(item => (
                        <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                </select>
            </div>

            {/* VALIDAZIONE & LOGICA OPZIONI */}
            {selectedMod && validationData && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 animate-fadeIn">
                    
                    {/* CASO A: FAI DA TE */}
                    {validationData.can_assemble_self ? (
                        <div className="text-emerald-400 flex items-start gap-2 text-sm mb-4">
                            <Cpu className="shrink-0 mt-0.5" size={18} />
                            <div>
                                <span className="font-bold">Compatibile.</span>
                                <p className="text-emerald-400/70 text-xs">Puoi procedere autonomamente.</p>
                            </div>
                        </div>
                    ) : (
                        /* CASO B: RICHIEDI AIUTO */
                        <div className="space-y-4">
                            <div className="text-amber-400 flex items-start gap-2 text-sm">
                                <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                                <div>
                                    <span className="font-bold">Competenze Insufficienti.</span>
                                    <p className="text-amber-400/80 text-xs mt-1">
                                        {validationData.reason_self}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-700">
                                <label className="block text-sm font-bold text-white mb-2">Chi deve eseguire il lavoro?</label>
                                
                                {isLoadingArtisans ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                                        <Loader2 className="animate-spin" size={16}/> Ricerca esperti disponibili...
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:border-indigo-500 outline-none"
                                        value={selectedTarget}
                                        onChange={(e) => setSelectedTarget(e.target.value)}
                                    >
                                        <option value="">-- Seleziona un Artigiano --</option>
                                        
                                        {/* OPZIONE SPECIALE ACCADEMIA */}
                                        <option value="ACADEMY" className="text-yellow-400 font-bold">
                                            🏛️ Richiesta in Accademia (100 CR) - Immediato
                                        </option>
                                        
                                        {/* ARTIGIANI DISPONIBILI */}
                                        {capableArtisans.length > 0 ? (
                                            <optgroup label="Giocatori Disponibili">
                                                {capableArtisans.map(a => (
                                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                                ))}
                                            </optgroup>
                                        ) : (
                                            <option disabled>Nessun altro giocatore capace trovato</option>
                                        )}
                                    </select>
                                )}
                            </div>

                            {/* LOGICA VISUALIZZAZIONE INPUT CREDITI */}
                            {selectedTarget === 'ACADEMY' ? (
                                <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded flex items-center gap-3">
                                    <GraduationCap className="text-yellow-500" size={24} />
                                    <div className="text-sm">
                                        <p className="text-yellow-200 font-bold">Servizio Accademico</p>
                                        <p className="text-yellow-500/80 text-xs">
                                            Costo fisso: <span className="text-white font-mono">100 CR</span>. 
                                            Esecuzione immediata.
                                        </p>
                                    </div>
                                </div>
                            ) : selectedTarget && (
                                <div className="relative animate-fadeIn">
                                    <label className="block text-xs text-gray-400 mb-1">Offerta per il giocatore</label>
                                    <Coins className="absolute left-2 top-8 text-yellow-500" size={16}/>
                                    <input 
                                        type="number" 
                                        placeholder="0" 
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 pl-8 text-sm text-white focus:border-yellow-500 outline-none"
                                        value={offerCredits}
                                        onChange={e => setOfferCredits(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Errori/Successi */}
            {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm flex items-center gap-2"><ShieldAlert size={16} /> {error}</div>}
            {success && <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded text-emerald-200 text-sm font-bold text-center">{success}</div>}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-xl flex justify-end gap-3">
            {selectedMod && validationData && (
                validationData.can_assemble_self ? (
                    // BOTTONE FAI DA TE
                    <button 
                        onClick={handleDirectAssembly}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wrench size={18} />}
                        Assembla Ora
                    </button>
                ) : (
                    // BOTTONE RICHIESTA (Accademia o Giocatore)
                    selectedTarget === 'ACADEMY' ? (
                        <button 
                            onClick={handleDirectAssembly} // Usa la stessa funzione, ma il flag useAcademy sarà true
                            disabled={isLoading}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-yellow-900/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <GraduationCap size={18} />}
                            Paga e Assembla (100 CR)
                        </button>
                    ) : (
                        <button 
                            onClick={handleSendRequest}
                            disabled={isSendingRequest || !selectedTarget}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSendingRequest ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Invia Richiesta
                        </button>
                    )
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemAssemblyModal;