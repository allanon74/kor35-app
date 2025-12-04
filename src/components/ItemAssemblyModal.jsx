import React, { useState, useEffect } from 'react';
import { X, Wrench, Send, ShieldAlert, Cpu, UserCheck, Loader2, Coins } from 'lucide-react';
import { useCharacter } from './CharacterContext';
// CORREZIONE 1: Importa assemblaOggetto e le nuove funzioni, rimuovi assemblaItem
import { assemblaOggetto, validateAssembly, createAssemblyRequest } from '../api'; 

const ItemAssemblyModal = ({ hostItem, inventory, onClose, onRefresh }) => {
  const { selectedCharacterData } = useCharacter();
  
  const [selectedModId, setSelectedModId] = useState('');
  const [selectedMod, setSelectedMod] = useState(null);
  
  // Stati Validazione
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(null);
  
  // Stati Richiesta Artigiano
  const [targetArtisan, setTargetArtisan] = useState('');
  const [offerCredits, setOfferCredits] = useState(0);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Stati Generali
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtro Oggetti Compatibili
  const compatibleItems = inventory.filter(item => {
    if (item.id === hostItem.id) return false;
    const isTechHost = hostItem.is_tecnologico;
    // Modifica: Aggiungi controllo null safe su tipo_oggetto
    if (isTechHost && item.tipo_oggetto === 'MOD') return true;
    if (!isTechHost && item.tipo_oggetto === 'MAT') return true;
    return false;
  });

  // Aggiorna oggetto selezionato
  useEffect(() => {
    const item = compatibleItems.find(i => i.id == selectedModId);
    setSelectedMod(item || null);
    setValidationData(null);
    setError(null);
  }, [selectedModId, compatibleItems]); // Aggiunto compatibleItems alle dipendenze

  // Validazione Asincrona
  useEffect(() => {
    if (!selectedMod || !selectedCharacterData) return;

    const validate = async () => {
      setIsValidating(true);
      setError(null);
      try {
        // CORREZIONE 2: Usa la funzione importata da api.js invece di axios
        const data = await validateAssembly(selectedCharacterData.id, hostItem.id, selectedMod.id);
        setValidationData(data);
      } catch (err) {
        console.error(err);
        setError("Impossibile verificare compatibilità remota.");
      } finally {
        setIsValidating(false);
      }
    };

    const timer = setTimeout(validate, 500);
    return () => clearTimeout(timer);
  }, [selectedMod, hostItem, selectedCharacterData]);

  // Azione: Assembla da solo
  const handleSelfAssembly = async () => {
    if (!selectedMod) return;
    setIsLoading(true);
    try {
      // CORREZIONE 3: Chiamata a assemblaOggetto con l'ordine parametri corretto
      // api.js definisce: (hostId, modId, characterId, onLogout)
      await assemblaOggetto(hostItem.id, selectedMod.id, selectedCharacterData.id);
      
      setSuccess("Oggetto assemblato con successo!");
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1500);
    } catch (err) {
      // Gestione errore migliorata per oggetti Error generici
      const msg = err.message || "Errore durante l'assemblaggio.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Azione: Invia Richiesta
  const handleSendRequest = async () => {
    if (!targetArtisan) {
        setError("Inserisci il nome dell'artigiano.");
        return;
    }
    setIsSendingRequest(true);
    try {
        // CORREZIONE 4: Usa funzione da api.js
        await createAssemblyRequest(
            selectedCharacterData.id, 
            hostItem.id, 
            selectedMod.id, 
            targetArtisan, 
            offerCredits
        );
        setSuccess(`Richiesta inviata a ${targetArtisan}! Attendi la sua approvazione.`);
        setTimeout(() => { onClose(); }, 2000);
    } catch (err) {
        const msg = err.message || "Errore invio richiesta.";
        setError(msg);
    } finally {
        setIsSendingRequest(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center rounded-t-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" size={20}/>
                Assemblaggio: <span className="text-amber-100">{hostItem.nome}</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto grow space-y-6">
            
            {/* Info Host */}
            <div className="flex gap-4 items-center bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                <div className={`p-2 rounded-full ${hostItem.is_tecnologico ? 'bg-cyan-900/50 text-cyan-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                    {hostItem.is_tecnologico ? <Cpu size={24} /> : <UserCheck size={24} />}
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                        {hostItem.is_tecnologico ? 'Tecnologico (Richiede Mod)' : 'Mondano (Richiede Materia)'}
                    </p>
                    <p className="text-sm text-gray-200">
                        Slot Disponibili: <span className="font-mono font-bold text-white">
                             {hostItem.potenziamenti_installati ? hostItem.potenziamenti_installati.length : 0} 
                             / {hostItem.classe_oggetto_nome ? 'MAX CLASSE' : '1'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Selezione Componente */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Seleziona Componente</label>
                <select 
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    onChange={(e) => setSelectedModId(e.target.value)}
                    value={selectedModId}
                >
                    <option value="">-- Seleziona dallo Zaino --</option>
                    {compatibleItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.nome} (Liv. {item.livello || 1})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Vengono mostrati solo componenti compatibili per tipo (Mod/Materia).
                </p>
            </div>

            {/* Box di Validazione */}
            {selectedMod && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    {isValidating ? (
                        <div className="flex items-center gap-2 text-indigo-400 text-sm">
                            <Loader2 className="animate-spin" size={16} /> Verifica compatibilità e competenze...
                        </div>
                    ) : validationData ? (
                        <>
                            {validationData.can_assemble_self ? (
                                <div className="text-emerald-400 flex items-start gap-2 text-sm">
                                    <Cpu className="shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <span className="font-bold">Compatibile.</span>
                                        <p className="text-emerald-400/70 text-xs mt-1">
                                            Hai le competenze necessarie per assemblare questo oggetto.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-amber-400 flex items-start gap-2 text-sm">
                                        <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <span className="font-bold">Competenze Insufficienti.</span>
                                            <p className="text-amber-400/80 text-xs mt-1">
                                                {validationData.reason_self}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Form Richiesta Artigiano */}
                                    <div className="pt-3 border-t border-gray-700 animate-fadeIn">
                                        <p className="text-white text-sm font-bold mb-2">Richiedi assistenza a un Artigiano:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Nome Personaggio Artigiano" 
                                                className="bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                                value={targetArtisan}
                                                onChange={e => setTargetArtisan(e.target.value)}
                                            />
                                            <div className="relative">
                                                <Coins className="absolute left-2 top-2.5 text-yellow-500" size={14}/>
                                                <input 
                                                    type="number" 
                                                    placeholder="Offerta Crediti" 
                                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 pl-8 text-sm text-white"
                                                    value={offerCredits}
                                                    onChange={e => setOfferCredits(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            )}

            {/* Messaggi Errore/Successo */}
            {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm flex items-center gap-2">
                    <ShieldAlert size={16} /> {error}
                </div>
            )}
            {success && (
                <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded text-emerald-200 text-sm font-bold text-center">
                    {success}
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-xl flex justify-end gap-3">
            {selectedMod && !isValidating && validationData && (
                validationData.can_assemble_self ? (
                    <button 
                        onClick={handleSelfAssembly}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Wrench size={18} />}
                        Assembla Ora
                    </button>
                ) : (
                    <button 
                        onClick={handleSendRequest}
                        disabled={isSendingRequest}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSendingRequest ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        Invia Richiesta
                    </button>
                )
            )}
            {!selectedMod && (
                 <span className="text-gray-500 text-sm self-center italic mr-2">Seleziona componenti...</span>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemAssemblyModal;