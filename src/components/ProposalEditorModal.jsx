import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Plus, Minus, Info, Box, Activity, Settings, Zap } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { 
    createProposta, 
    updateProposta, 
    sendProposta, 
    deleteProposta, 
    getAllPunteggi, 
    getMattoniAura, 
    getClassiOggetto 
} from '../api';
import IconaPunteggio from './IconaPunteggio';

// Costanti Slot Corporei
const BODY_SLOTS = [
    { id: 'HD1', label: 'Testa (Cervello/Sensi)' },
    { id: 'HD2', label: 'Testa (Volto/Esterno)' },
    { id: 'TR1', label: 'Tronco (Organi Vitali)' },
    { id: 'TR2', label: 'Tronco (Struttura/Pelle)' },
    { id: 'RA', label: 'Braccio Destro' },
    { id: 'LA', label: 'Braccio Sinistro' },
    { id: 'RL', label: 'Gamba Destra' },
    { id: 'LL', label: 'Gamba Sinistra' },
];

// Mappa Tipi Oggetto per UI
const ITEM_TYPES = {
    'MOD': { label: 'Mod (Tecnologico)', icon: Settings, isBound: false },
    'MAT': { label: 'Materia (Arcano)', icon: Zap, isBound: false },
    'INNESTO': { label: 'Innesto (Chirurgico)', icon: Activity, isBound: true },
    'MUTAZIONE': { label: 'Mutazione (Biologico)', icon: Activity, isBound: true }
};

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // --- STATI DATI PROPOSTA ---
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || '');
    
    // --- STATI LOGICA TIPO OGGETTO ---
    const [selectedItemType, setSelectedItemType] = useState(''); // 'MOD', 'MAT', 'INNESTO', 'MUTAZIONE'
    const [availableItemOptions, setAvailableItemOptions] = useState([]); 
    
    // --- STATI FILTRI ---
    const [selectedClasseId, setSelectedClasseId] = useState(''); 
    const [selectedSlots, setSelectedSlots] = useState([]);
    
    // Init componenti
    const initialComponents = {};
    if (proposal?.componenti) {
        proposal.componenti.forEach(c => {
            const id = c.caratteristica?.id || c.caratteristica_id || c.caratteristica; 
            if(id) initialComponents[id] = c.valore;
        });
    }
    const [componentsMap, setComponentsMap] = useState(initialComponents);

    // Cache
    const [allPunteggiCache, setAllPunteggiCache] = useState([]);
    const [availableAuras, setAvailableAuras] = useState([]);        
    const [availableInfusionAuras, setAvailableInfusionAuras] = useState([]); 
    const [availableCharacteristics, setAvailableCharacteristics] = useState([]);
    const [availableMattoni, setAvailableMattoni] = useState([]); 
    const [availableClassi, setAvailableClassi] = useState([]);   
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;
    const isInfusion = type === 'Infusione';

    // Init Slot se edit
    useEffect(() => {
        if (proposal?.slot_corpo_permessi) {
            setSelectedSlots(proposal.slot_corpo_permessi.split(','));
        }
    }, [proposal]);

    // 1. CARICAMENTO DATI
    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const allData = await getAllPunteggi();
                setAllPunteggiCache(allData);

                if (char && char.punteggi_base) {
                    const validAuras = allData.filter(p => {
                        if (p.tipo !== 'AU') return false;
                        const val = char.punteggi_base[p.nome];
                        if (!val || val < 1) return false;
                        if (isInfusion && !p.permette_infusioni) return false;
                        if (!isInfusion && !p.permette_tessiture) return false;
                        return true;
                    });
                    setAvailableAuras(validAuras);

                    const validChars = allData.filter(p => {
                        if (p.tipo !== 'CA') return false;
                        const val = char.punteggi_base[p.nome];
                        return val && val > 0;
                    });
                    setAvailableCharacteristics(validChars);
                }

                if (isInfusion) {
                    const classiData = await getClassiOggetto();
                    setAvailableClassi(classiData || []);
                }
            } catch (e) {
                console.error(e);
                setError("Errore caricamento dati.");
            } finally {
                setIsLoadingData(false);
            }
        };
        initData();
    }, [char, type, isInfusion]);

    // 2. CAMBIO AURA -> CALCOLO TIPI AMMESSI
    useEffect(() => {
        if (!selectedAuraId || !isInfusion) {
            setAvailableMattoni([]);
            setAvailableItemOptions([]);
            setSelectedItemType('');
            return;
        }

        // Carica Mattoni
        getMattoniAura(selectedAuraId).then(setAvailableMattoni).catch(console.error);

        // Calcola Opzioni
        const auraObj = allPunteggiCache.find(p => p.id === parseInt(selectedAuraId));
        if (auraObj) {
            const options = [];
            if (auraObj.produce_mod) options.push('MOD');
            if (auraObj.produce_materia) options.push('MAT');
            if (auraObj.produce_innesti) options.push('INNESTO');
            if (auraObj.produce_mutazioni) options.push('MUTAZIONE');
            
            setAvailableItemOptions(options);

            if (options.length > 0 && !options.includes(selectedItemType)) {
                setSelectedItemType(options[0]);
            } else if (options.length === 0) {
                setSelectedItemType('');
            }
        }
    }, [selectedAuraId, allPunteggiCache, isInfusion]);

    // 3. AURE SECONDARIE
    useEffect(() => {
        if (!isInfusion || !selectedAuraId || allPunteggiCache.length === 0) {
            setAvailableInfusionAuras([]);
            return;
        }
        const mainAuraObj = allPunteggiCache.find(p => p.id === parseInt(selectedAuraId));
        if (!mainAuraObj) return;

        const allowedIds = mainAuraObj.aure_infusione_consentite || [mainAuraObj.id];
        const validInfusionObjs = allPunteggiCache.filter(p => allowedIds.includes(p.id));
        setAvailableInfusionAuras(validInfusionObjs);
        
        if (validInfusionObjs.length > 0 && !allowedIds.includes(parseInt(selectedInfusionAuraId))) {
             setSelectedInfusionAuraId(validInfusionObjs[0].id);
        }
    }, [selectedAuraId, allPunteggiCache, isInfusion, selectedInfusionAuraId]);


    // --- HELPERS DI CALCOLO ---
    const getAuraName = (id) => allPunteggiCache.find(p => p.id === parseInt(id))?.nome || '...';
    // Calcola il valore dell'aura del PG per sapere il limite massimo di punti spendibili
    const auraVal = char?.punteggi_base[getAuraName(selectedAuraId)] || 0;
    // Calcola quanti punti sono stati spesi finora
    const currentTotalCount = Object.values(componentsMap).reduce((a, b) => a + b, 0);
    const cost = currentTotalCount * 10;


    // --- HANDLERS LOGICI ---

    // Handler Incremento (+): Aggiunto
    const handleIncrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        const charName = allPunteggiCache.find(p => p.id === charId)?.nome;
        // Il valore massimo della caratteristica nella proposta non può superare quello che il PG possiede
        const maxVal = char.punteggi_base[charName] || 0;
        
        // Verifica limiti: Non superare stat PG e non superare totale Aura PG
        if (currentVal < maxVal && currentTotalCount < auraVal) {
            setComponentsMap({ ...componentsMap, [charId]: currentVal + 1 });
        }
    };

    // Handler Decremento (-): Aggiunto
    const handleDecrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        if (currentVal > 0) {
            const newMap = { ...componentsMap, [charId]: currentVal - 1 };
            if (newMap[charId] === 0) delete newMap[charId];
            setComponentsMap(newMap);
        }
    };

    const handleTypeChange = (newType) => {
        setSelectedItemType(newType);
        const typeInfo = ITEM_TYPES[newType];
        if (typeInfo?.isBound) setSelectedClasseId('');
        else setSelectedSlots([]);
    };

    const isCharCompatible = (charId) => {
        const typeInfo = ITEM_TYPES[selectedItemType];
        if (!typeInfo || typeInfo.isBound) return true;

        if (selectedClasseId) {
            const classeObj = availableClassi.find(c => c.id == selectedClasseId);
            if (!classeObj) return true;
            
            if (selectedItemType === 'MOD') return classeObj.mod_allowed_ids.includes(parseInt(charId));
            if (selectedItemType === 'MAT') return classeObj.materia_allowed_ids.includes(parseInt(charId));
        }
        return true;
    };

    const toggleSlot = (slotCode) => {
        setSelectedSlots(prev => 
            prev.includes(slotCode) ? prev.filter(s => s !== slotCode) : [...prev, slotCode]
        );
    };

    const getPayload = () => {
        const componentsArray = Object.entries(componentsMap).map(([id, val]) => ({
            caratteristica: parseInt(id),
            valore: val
        }));
        
        const typeInfo = ITEM_TYPES[selectedItemType];
        const slotsToSave = (typeInfo?.isBound) ? selectedSlots.join(',') : '';

        return {
            personaggio_id: selectedCharacterId,
            tipo: isInfusion ? 'INF' : 'TES',
            nome: name,
            descrizione: description,
            aura: selectedAuraId,
            aura_infusione: isInfusion ? selectedInfusionAuraId : null,
            componenti: componentsArray,
            slot_corpo_permessi: slotsToSave
        };
    };

    const handleSaveAction = async (send = false) => {
        setError(''); setIsSaving(true);
        try {
            if (send && !window.confirm("Invio definitivo?")) {
                setIsSaving(false); return;
            }
            let targetId = proposal?.id;
            const payload = getPayload();
            
            if (!targetId) {
                const newP = await createProposta(payload);
                targetId = newP.id;
            } else {
                await updateProposta(targetId, payload);
            }

            if (send) await sendProposta(targetId);
            onRefresh(); onClose();
        } catch (e) { setError(e.message); } finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm("Eliminare?")) return;
        try { await deleteProposta(proposal.id); onRefresh(); onClose(); } catch (e) { setError(e.message); }
    };

    const findBrickDefinition = (auraId, charId) => {
        if (parseInt(auraId) === parseInt(selectedAuraId)) {
            return availableMattoni.find(m => m.caratteristica?.id === parseInt(charId));
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[95vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl animate-fadeIn">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isInfusion ? <Box className="text-amber-500" size={20}/> : <Info className="text-indigo-400" size={20}/>}
                        {isEditing ? `Modifica ${type}` : `Crea ${type}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && <div className="p-3 bg-red-900/30 text-red-200 rounded border border-red-800 flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Nome</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1"/>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Aura Richiesta</label>
                            <select value={selectedAuraId} onChange={e => { setComponentsMap({}); setSelectedAuraId(e.target.value); }} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1">
                                <option value="">-- Seleziona --</option>
                                {availableAuras.map(a => <option key={a.id} value={a.id}>{a.nome} ({char.punteggi_base[a.nome]})</option>)}
                            </select>
                        </div>

                        {isInfusion && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Aura Infusione</label>
                                <select value={selectedInfusionAuraId} onChange={e => setSelectedInfusionAuraId(e.target.value)} disabled={!isDraft || !selectedAuraId} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1">
                                    <option value="">-- Nessuna --</option>
                                    {availableInfusionAuras.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* --- ZONA TIPO OGGETTO & FILTRI --- */}
                    {isInfusion && selectedAuraId && (
                        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg space-y-4">
                            
                            {/* Warning se non configurato */}
                            {availableItemOptions.length === 0 ? (
                                <div className="text-yellow-400 text-sm italic flex gap-2">
                                    <AlertTriangle size={16}/> 
                                    Attenzione: Questa Aura non ha tipi di oggetto abilitati. Contatta un admin.
                                </div>
                            ) : (
                                /* Selezione Tipo Oggetto */
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Tipo Oggetto Generato</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableItemOptions.map(opt => {
                                            const typeInfo = ITEM_TYPES[opt];
                                            const Icon = typeInfo.icon;
                                            const isSelected = selectedItemType === opt;
                                            return (
                                                <button 
                                                    key={opt}
                                                    onClick={() => handleTypeChange(opt)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold border transition-all ${
                                                        isSelected 
                                                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                                                        : 'bg-gray-900 border-gray-600 text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    <Icon size={14}/> {typeInfo.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Filtri Specifici */}
                            {selectedItemType && (
                                <div className="pt-2 border-t border-gray-700">
                                    {ITEM_TYPES[selectedItemType].isBound ? (
                                        // UI INNESTI/MUTAZIONI
                                        <div>
                                            <label className="text-xs font-bold text-pink-400 uppercase flex items-center gap-2 mb-2">
                                                <Activity size={14}/> Slot Corporei Consentiti
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {BODY_SLOTS.map(slot => (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => toggleSlot(slot.id)}
                                                        className={`p-2 rounded text-xs font-bold border transition-all ${
                                                            selectedSlots.includes(slot.id)
                                                            ? 'bg-pink-900/50 border-pink-500 text-pink-200'
                                                            : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // UI MOD/MATERIA
                                        <div>
                                            <label className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2 mb-2">
                                                <Box size={14}/> Filtra per Classe Oggetto
                                            </label>
                                            <select 
                                                className="w-full bg-gray-900 border border-indigo-500/30 rounded p-2 text-white text-sm"
                                                value={selectedClasseId}
                                                onChange={e => setSelectedClasseId(e.target.value)}
                                            >
                                                <option value="">-- Mostra Tutto --</option>
                                                {availableClassi.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                            {selectedClasseId && <p className="text-[10px] text-indigo-400 mt-1">Mattoni incompatibili oscurati.</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Descrizione</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1" rows={2}/>
                    </div>

                    {/* LISTA MATTONI */}
                    {selectedAuraId && (
                    <div className="bg-gray-800/50 rounded border border-gray-700 p-2">
                        <div className="flex justify-between text-gray-400 text-xs mb-2 px-2 uppercase font-bold">
                            <span>Componenti ({currentTotalCount}/{selectedAuraId ? auraVal : '-'})</span>
                            <span>{cost} CR</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableCharacteristics.map(charObj => {
                                const primaryBrick = findBrickDefinition(selectedAuraId, charObj.id);
                                const count = componentsMap[charObj.id] || 0;
                                const hasPrimary = !!primaryBrick;
                                
                                const isCompatible = isCharCompatible(charObj.id);
                                const opacityClass = isCompatible ? 'opacity-100' : 'opacity-30 grayscale';

                                return (
                                    <div key={charObj.id} className={`flex items-center justify-between p-2 rounded border transition-all ${count > 0 ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700'} ${opacityClass}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {!hasPrimary ? (
                                                    <IconaPunteggio url={charObj.icona_url} color={charObj.colore} size="xs" />
                                                ) : (
                                                    <div className="relative" title={`Mattone: ${primaryBrick.nome}`}>
                                                        <IconaPunteggio url={primaryBrick.icona_url} color={primaryBrick.colore} size="xs" />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                                    {hasPrimary ? primaryBrick.nome : charObj.nome}
                                                    <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1 py-0.5 rounded border border-gray-700">
                                                        {charObj.sigla}
                                                    </span>
                                                </div>
                                                {!isCompatible && <div className="text-[10px] text-red-400 font-bold uppercase">Non Compatibile</div>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded border border-gray-700">
                                            <button onClick={() => handleDecrement(charObj.id)} disabled={!isDraft || count === 0} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"><Minus size={12}/></button>
                                            <span className="w-6 text-center text-white font-mono">{count}</span>
                                            <button onClick={() => handleIncrement(charObj.id)} disabled={!isDraft || !isCompatible} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30"><Plus size={12}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between shrink-0">
                    {isDraft && isEditing ? <button onClick={handleDelete} className="text-red-400 text-xs flex items-center gap-1 hover:text-red-300"><Trash2 size={14}/> Elimina Bozza</button> : <div/>}
                    <div className="flex gap-2">
                        {isDraft && (
                            <>
                                <button onClick={() => handleSaveAction(false)} disabled={isSaving} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex gap-2 items-center"><Save size={14}/> Salva</button>
                                <button onClick={() => handleSaveAction(true)} disabled={isSaving || currentTotalCount === 0} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm flex gap-2 items-center font-bold shadow-lg shadow-green-900/20"><Send size={14}/> Invia</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;