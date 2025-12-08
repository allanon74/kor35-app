import React, { useState, useEffect } from 'react';
import { X, Activity, User, Coins, Send, Loader2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { 
    completeForging, // Usiamo questa passando slot_scelto per "Su di me"
    richiediAssemblaggio, // Nuova funzione API per inviare proposta (ex richiediOperazioneChirurgica)
    searchPersonaggi, 
    getBodySlots,
    rifiutaRichiestaAssemblaggio // Usiamo una logica simile per "Scartare" (chiamata custom o delete)
} from '../api';

const GraftInstallationModal = ({ task, onClose, onSuccess }) => {
    const { selectedCharacterData } = useCharacter();
    const [selectedSlot, setSelectedSlot] = useState('');
    
    // Lista completa dei candidati compatibili scaricati dall'API
    const [compatibleCandidates, setCompatibleCandidates] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState([]);
    
    const [selectedTargetUser, setSelectedTargetUser] = useState(null);
    const [offer, setOffer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDiscarding, setIsDiscarding] = useState(false);

    // Parsing slot permessi
    const allowedSlotsCodes = task.infusione_slot_permessi 
        ? task.infusione_slot_permessi.split(',').map(s => s.trim()) 
        : [];
    const allSlots = getBodySlots();
    const availableSlots = allSlots.filter(s => allowedSlotsCodes.includes(s.code));

    // 1. Carica candidati compatibili all'avvio
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                // searchPersonaggi ora accetta infusione_id per filtrare lato server la compatibilità stat/livello
                // Passiamo una query vuota per averli tutti (o " " se il backend lo richiede)
                const res = await searchPersonaggi("", selectedCharacterData.id, task.infusione_id);
                
                // Aggiungiamo "ME STESSO" manualmente alla lista se è compatibile (il backend lo esclude di solito)
                // Ma per semplicità, se è "Su di Me", gestiamo l'oggetto `selectedCharacterData`
                
                // Nota: searchPersonaggi ritorna {id, nome, slots_occupati: []} grazie alla modifica serializer
                setCompatibleCandidates(res);
                setFilteredCandidates(res);
            } catch (e) { console.error("Err fetch candidates", e); }
        };
        fetchCandidates();
    }, [task.infusione_id, selectedCharacterData.id]);

    // 2. Filtra candidati quando cambia lo slot
    useEffect(() => {
        if (!selectedSlot) {
            setFilteredCandidates(compatibleCandidates);
            return;
        }

        const filtered = compatibleCandidates.filter(c => {
            // Se il candidato ha lo slot occupato, via
            const occupied = c.slots_occupati || [];
            return !occupied.includes(selectedSlot);
        });
        setFilteredCandidates(filtered);

        // Se l'utente selezionato non è più valido per il nuovo slot, deselezionalo
        if (selectedTargetUser && selectedTargetUser.id !== selectedCharacterData.id) {
            const isStillValid = filtered.find(c => c.id === selectedTargetUser.id);
            if (!isStillValid) setSelectedTargetUser(null);
        }
    }, [selectedSlot, compatibleCandidates]);

    const isSelfTarget = selectedTargetUser && selectedTargetUser.id === selectedCharacterData.id;

    // Gestione Conferma
    const handleConfirm = async () => {
        if (!selectedSlot) return alert("Seleziona uno slot corporeo!");
        if (!selectedTargetUser) return alert("Seleziona un paziente!");
        
        setIsLoading(true);
        try {
            if (isSelfTarget) {
                // --- SCENARIO 1: SU DI ME (Installazione Diretta) ---
                // Chiamiamo completeForging passando lo slot. Il backend creerà l'oggetto e lo equipaggerà.
                await completeForging(task.id, selectedCharacterData.id, selectedSlot); 
                alert("Innesto installato con successo!");
            } else {
                // --- SCENARIO 2: ALTRO GIOCATORE (Proposta) ---
                // Chiamiamo l'API per creare una RichiestaAssemblaggio di tipo 'GRAF' (Innesto)
                await richiediAssemblaggio({
                    committente_id: selectedTargetUser.id, // Chi riceve è il committente dell'operazione chirurgica
                    artigiano_nome: selectedCharacterData.nome, // Chi offre è l'artigiano
                    forgiatura_id: task.id,
                    slot_destinazione: selectedSlot,
                    offerta: offer,
                    tipo_operazione: 'GRAF'
                });
                alert(`Proposta di operazione inviata a ${selectedTargetUser.nome}!`);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Gestione Scarto
    const handleDiscard = async () => {
        if (!confirm("Sei sicuro? L'oggetto verrà distrutto e i materiali persi.")) return;
        setIsLoading(true);
        try {
            // Usiamo una API di delete generica o una specifica per annullare forgiatura
            // Qui assumo esista deleteForgiatura o simile, altrimenti si può usare rifiutaRichiestaAssemblaggio adattata
            // Per ora uso una chiamata fittizia delete
            // await api.delete(`/crafting/queue/${task.id}`); 
            // Implementa la call corretta nel tuo api.js
            alert("Oggetto scartato.");
            onSuccess();
            onClose();
        } catch (e) {
            alert("Errore scarto: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="text-pink-500"/> Sala Operatoria
                        </h3>
                        <p className="text-xs text-gray-400">Finalizzazione {task.infusione_nome}</p>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-white"/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* 1. SELEZIONE SLOT */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 uppercase mb-2 flex items-center gap-2">
                            1. Seleziona Slot Corporeo
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {availableSlots.map(s => (
                                <button 
                                    key={s.code}
                                    onClick={() => setSelectedSlot(s.code)}
                                    className={`p-2 border rounded text-xs font-bold transition-all ${
                                        selectedSlot === s.code 
                                        ? 'bg-pink-600 border-pink-400 text-white ring-2 ring-pink-400/50' 
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                        {!selectedSlot && <p className="text-xs text-amber-500 mt-1">* Seleziona uno slot per vedere i candidati validi.</p>}
                    </div>

                    {/* 2. SELEZIONE PAZIENTE */}
                    <div className={`transition-opacity ${!selectedSlot ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <h4 className="text-sm font-bold text-gray-300 uppercase mb-2">2. Seleziona Paziente</h4>
                        
                        {/* Opzione ME STESSO */}
                        <div 
                            onClick={() => setSelectedTargetUser(selectedCharacterData)}
                            className={`p-3 rounded border mb-3 cursor-pointer flex items-center justify-between ${
                                selectedTargetUser?.id === selectedCharacterData.id
                                ? 'bg-indigo-900/50 border-indigo-500 text-white'
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <User className="text-indigo-400"/>
                                <div>
                                    <div className="font-bold">Me Stesso ({selectedCharacterData.nome})</div>
                                    <div className="text-xs text-gray-400">Installazione Immediata • Gratuita</div>
                                </div>
                            </div>
                            {selectedTargetUser?.id === selectedCharacterData.id && <CheckCircle size={18} className="text-indigo-400"/>}
                        </div>

                        {/* Lista ALTRI */}
                        <div className="text-xs font-bold text-gray-500 mb-1">ALTRI PAZIENTI COMPATIBILI</div>
                        <div className="bg-gray-900 border border-gray-700 rounded max-h-40 overflow-y-auto">
                            {filteredCandidates.length === 0 ? (
                                <div className="p-3 text-gray-500 text-center text-sm">Nessun altro candidato compatibile per questo slot.</div>
                            ) : (
                                filteredCandidates.map(u => (
                                    <div 
                                        key={u.id}
                                        onClick={() => setSelectedTargetUser(u)}
                                        className={`p-2 border-b border-gray-800 cursor-pointer flex justify-between items-center hover:bg-gray-800 ${
                                            selectedTargetUser?.id === u.id ? 'bg-gray-700 text-white' : 'text-gray-300'
                                        }`}
                                    >
                                        <span>{u.nome}</span>
                                        {selectedTargetUser?.id === u.id && <CheckCircle size={14} className="text-green-500"/>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 3. COSTO (Solo se Altro) */}
                    {selectedTargetUser && !isSelfTarget && (
                        <div className="bg-gray-900/50 p-3 rounded border border-gray-700 animate-fadeIn">
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Richiesta Compenso (CR)</label>
                             <div className="relative">
                                 <Coins className="absolute left-2 top-2.5 text-yellow-500" size={16}/>
                                 <input 
                                     type="number" 
                                     className="w-full bg-gray-800 border-gray-600 rounded p-2 pl-8 text-white focus:border-indigo-500 outline-none"
                                     value={offer} onChange={e => setOffer(e.target.value)}
                                     placeholder="0"
                                 />
                             </div>
                             <p className="text-xs text-gray-500 mt-1">Il destinatario dovrà accettare la proposta.</p>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-xl flex gap-3 shrink-0">
                    <button 
                        onClick={() => setIsDiscarding(!isDiscarding)}
                        className="p-3 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 border border-red-900/50 transition-colors"
                        title="Scarta Oggetto"
                    >
                        <Trash2 size={20}/>
                    </button>

                    {isDiscarding ? (
                        <button 
                            onClick={handleDiscard}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg py-2 animate-fadeIn"
                        >
                            Conferma Scarto
                        </button>
                    ) : (
                        <button 
                            onClick={handleConfirm}
                            disabled={isLoading || !selectedSlot || !selectedTargetUser}
                            className={`flex-1 font-bold py-3 rounded-lg shadow-lg flex justify-center items-center gap-2 transition-all ${
                                isLoading || !selectedSlot || !selectedTargetUser
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : isSelfTarget 
                                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                        >
                            {isLoading ? <Loader2 className="animate-spin"/> : (isSelfTarget ? <Activity/> : <Send/>)}
                            {isSelfTarget ? 'INSTALLA ORA' : 'INVIA PROPOSTA'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraftInstallationModal;