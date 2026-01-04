import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Plus, Minus, Info, Box, Activity, Settings, Zap, Users, Scroll } from 'lucide-react';
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

// Costanti Slot Corporei (Invariate)
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
    
    // Campi Cerimoniale
    const [prerequisiti, setPrerequisiti] = useState(proposal?.prerequisiti || '');
    const [svolgimento, setSvolgimento] = useState(proposal?.svolgimento || '');
    const [effetto, setEffetto] = useState(proposal?.effetto || '');
    const [livelloCerimoniale, setLivelloCerimoniale] = useState(proposal?.livello || 1);

    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || '');
    
    // --- STATI LOGICA TIPO OGGETTO ---
    const [selectedItemType, setSelectedItemType] = useState('');
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
    const isCerimoniale = type === 'Cerimoniale';

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
                        if (!isInfusion && !isCerimoniale && !p.permette_tessiture) return false;
                        // Logica Cerimoniali
                        if (isCerimoniale && p.permette_cerimoniali === false) return false; 
                        
                        return true;
                    });
                    setAvailableAuras(validAuras);

                    const validChars = allData.filter(p => {
                        if (p.tipo !== 'CA') return false;
                        // Cerimoniali: Scelta Libera
                        if (isCerimoniale) return true;
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
    }, [char, type, isInfusion, isCerimoniale]);

    // 2. CAMBIO AURA -> CALCOLO TIPI AMMESSI E MATTONI
    useEffect(() => {
        if (!selectedAuraId) {
            setAvailableMattoni([]);
            setAvailableItemOptions([]);
            setSelectedItemType('');
            return;
        }

        getMattoniAura(selectedAuraId).then(setAvailableMattoni).catch(console.error);

        if (!isInfusion) return;

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
    }, [selectedAuraId, allPunteggiCache, isInfusion, selectedItemType]);

    // 3. AURE SECONDARIE (Infusioni)
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


    // HANDLERS
    const handleTypeChange = (newType) => {
        setSelectedItemType(newType);
        const typeInfo = ITEM_TYPES[newType];
        if (typeInfo?.isBound) setSelectedClasseId('');
        else setSelectedSlots([]);
    };

    const isCharCompatible = (charId) => {
        if (!isInfusion) return true;
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

    const mapUiTypeToDb = (uiType) => {
        if (uiType === 'INNESTO' || uiType === 'MUTAZIONE') return 'AUM';
        return 'POT';
    };

    // CALCOLO LIVELLO MAX CERIMONIALE
    const getMaxCerimonialeLevel = () => {
        if (!selectedAuraId || !char) return 0;
        const auraObj = availableAuras.find(a => a.id == selectedAuraId);
        const auraVal = auraObj ? (char.punteggi_base[auraObj.nome] || 0) : 0;
        const ccoStat = char.statistiche?.find(s => s.sigla === 'CCO');
        const ccoVal = ccoStat ? ccoStat.valore : 0;
        return Math.min(auraVal, ccoVal);
    };

    const getPayload = () => {
        const componentsArray = Object.entries(componentsMap).map(([id, val]) => ({
            id: parseInt(id), 
            valore: val
        }));
        
        let dbType = 'TES';
        if (isInfusion) dbType = 'INF';
        if (isCerimoniale) dbType = 'CER';

        const typeInfo = isInfusion ? ITEM_TYPES[selectedItemType] : null;
        const slotsToSave = (typeInfo?.isBound) ? selectedSlots.join(',') : '';
        const tipoRisultato = isInfusion ? mapUiTypeToDb(selectedItemType) : null;

        return {
            personaggio_id: selectedCharacterId,
            tipo: dbType,
            nome: name,
            descrizione: !isCerimoniale ? description : "Cerimoniale Narrativo",
            aura: selectedAuraId,
            aura_infusione: isInfusion ? selectedInfusionAuraId : null,
            tipo_risultato_atteso: tipoRisultato,
            componenti_data: componentsArray, 
            slot_corpo_permessi: slotsToSave,
            // Campi Cerimoniale
            prerequisiti: isCerimoniale ? prerequisiti : null,
            svolgimento: isCerimoniale ? svolgimento : null,
            effetto: isCerimoniale ? effetto : null,
            livello: isCerimoniale ? livelloCerimoniale : null,
        };
    };

    const handleSaveAction = async (send = false) => {
        setError(''); 
        if (!name) return setError("Nome obbligatorio.");
        if (!selectedAuraId) return setError("Aura obbligatoria.");
        if (isCerimoniale) {
            if (!prerequisiti || !svolgimento || !effetto) {
                return setError("Tutti i campi di testo del rituale sono obbligatori.");
            }
            if (livelloCerimoniale < 1) return setError("Il livello deve essere almeno 1.");
        }

        setIsSaving(true);
        try {
            if (send && !window.confirm("Invio definitivo? Non potrai più modificarlo.")) {
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
        } catch (e) { 
            setError(e.message || "Errore salvataggio"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Eliminare questa bozza?")) return;
        try {
            await deleteProposta(proposal.id);
            onRefresh(); onClose();
        } catch (e) { setError(e.message); }
    };

    const currentTotalCount = Object.values(componentsMap).reduce((a, b) => a + b, 0);
    const handleIncrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        setComponentsMap({ ...componentsMap, [charId]: currentVal + 1 });
    };
    const handleDecrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        if (currentVal <= 1) {
            const newMap = { ...componentsMap };
            delete newMap[charId];
            setComponentsMap(newMap);
        } else {
            setComponentsMap({ ...componentsMap, [charId]: currentVal - 1 });
        }
    };

    if (!char) return null;
    const maxLivelloCerimoniale = getMaxCerimonialeLevel();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isInfusion ? <Box className="text-amber-500" size={20}/> : 
                         isCerimoniale ? <Users className="text-purple-400" size={20}/> :
                         <Scroll className="text-indigo-400" size={20}/>}
                        {isEditing ? `Modifica ${type}` : `Crea ${type}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && <div className="p-3 bg-red-900/30 text-red-200 rounded border border-red-800 flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={isInfusion ? "" : "md:col-span-2"}>
                            <label className="text-xs font-bold text-gray-400 uppercase">Nome</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1 focus:border-indigo-500 outline-none" placeholder={`Nome ${type}`} />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Aura Richiesta</label>
                            <select value={selectedAuraId} onChange={e => {setComponentsMap({}); setSelectedAuraId(e.target.value); setLivelloCerimoniale(1);}} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1 focus:border-indigo-500 outline-none">
                                <option value="">-- Seleziona --</option>
                                {availableAuras.map(a => <option key={a.id} value={a.id}>{a.nome} ({char.punteggi_base[a.nome] || 0})</option>)}
                            </select>
                        </div>

                        {isCerimoniale && selectedAuraId && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-purple-400 uppercase flex justify-between">
                                    Livello Rituale
                                    <span className="text-gray-500 italic text-[10px]">Max: {maxLivelloCerimoniale} (Min(Aura, CCO))</span>
                                </label>
                                <select value={livelloCerimoniale} onChange={e => setLivelloCerimoniale(parseInt(e.target.value))} className="w-full bg-gray-800 border border-purple-500/50 rounded p-2 text-white mt-1 focus:border-purple-500 outline-none">
                                    {[...Array(maxLivelloCerimoniale + 1).keys()].slice(1).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                    {maxLivelloCerimoniale === 0 && <option value="0">0 (Requisiti insufficienti)</option>}
                                </select>
                            </div>
                        )}

                        {isInfusion && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Aura Infusione</label>
                                <select value={selectedInfusionAuraId} onChange={e => setSelectedInfusionAuraId(e.target.value)} disabled={!isDraft || !selectedAuraId} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1">
                                    <option value="">-- Nessuna --</option>
                                    {availableInfusionAuras.map(a => <option key={a.id} value={a.id}>{a.nome} ({char.punteggi_base[a.nome]})</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {isCerimoniale ? (
                        <div className="space-y-4 pt-4 border-t border-gray-700">
                            <div>
                                <label className="block text-xs font-bold text-purple-400 uppercase mb-1">Prerequisiti Narrativi</label>
                                <textarea value={prerequisiti} onChange={e => setPrerequisiti(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm h-20 focus:border-purple-500 outline-none" placeholder="Cosa serve per iniziare il rito?" disabled={!isDraft} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-400 uppercase mb-1">Svolgimento</label>
                                <textarea value={svolgimento} onChange={e => setSvolgimento(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm h-28 focus:border-purple-500 outline-none" placeholder="Descrivi le azioni del rito..." disabled={!isDraft} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-400 uppercase mb-1">Effetto</label>
                                <textarea value={effetto} onChange={e => setEffetto(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm h-20 focus:border-purple-500 outline-none" placeholder="Cosa accade al termine?" disabled={!isDraft} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Descrizione / Meccaniche</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1 focus:border-indigo-500 outline-none" rows={3}/>
                            </div>

                            {isInfusion && selectedAuraId && (
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <h3 className="text-sm font-bold text-amber-500 mb-3 flex items-center gap-2"><Settings size={16}/> Configurazione Oggetto</h3>
                                    <div className="flex gap-2 mb-4">
                                        {availableItemOptions.map(optKey => {
                                            const info = ITEM_TYPES[optKey];
                                            return (
                                                <button key={optKey} onClick={() => handleTypeChange(optKey)} className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${selectedItemType === optKey ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                                    <info.icon size={14}/> {info.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {selectedItemType && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            {ITEM_TYPES[selectedItemType].isBound ? (
                                                <div>
                                                    <label className="text-xs font-bold text-pink-400 uppercase block mb-2">Slot Corporei Richiesti</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {BODY_SLOTS.map(slot => (
                                                            <button key={slot.id} onClick={() => toggleSlot(slot.id)} className={`p-2 text-[10px] uppercase font-bold rounded border transition-all ${selectedSlots.includes(slot.id) ? 'bg-pink-900/50 border-pink-500 text-pink-200' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                                {slot.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2 mb-2"><Box size={14}/> Classe Oggetto</label>
                                                    <select className="w-full bg-gray-900 border border-indigo-500/30 rounded p-2 text-white text-sm" value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}>
                                                        <option value="">-- Mostra Tutto --</option>
                                                        {availableClassi.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {selectedAuraId && (
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Mattoni & Caratteristiche</label>
                                <span className="text-xs text-gray-500">Totale: {currentTotalCount} Mattoni</span>
                            </div>
                            <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                                {availableCharacteristics.map(charItem => {
                                    const count = componentsMap[charItem.id] || 0;
                                    const isCompatible = isCharCompatible(charItem.id);
                                    return (
                                        <div key={charItem.id} className={`flex items-center justify-between bg-gray-900 p-2 rounded border ${count > 0 ? 'border-indigo-500' : 'border-gray-700'} ${!isCompatible ? 'opacity-30 pointer-events-none' : ''}`}>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <IconaPunteggio punteggio={charItem} size="24px" />
                                                <span className="text-xs font-bold truncate text-gray-300">{charItem.nome}</span>
                                            </div>
                                            {isDraft && (
                                                <div className="flex items-center gap-1">
                                                    {count > 0 && <button onClick={() => handleDecrement(charItem.id)} className="w-6 h-6 flex items-center justify-center bg-gray-800 hover:bg-red-900/50 rounded text-red-400"><Minus size={12}/></button>}
                                                    {count > 0 && <span className="text-xs font-mono w-4 text-center">{count}</span>}
                                                    <button onClick={() => handleIncrement(charItem.id)} className="w-6 h-6 flex items-center justify-center bg-gray-800 hover:bg-green-900/50 rounded text-green-400"><Plus size={12}/></button>
                                                </div>
                                            )}
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