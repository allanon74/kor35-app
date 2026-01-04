import React, { useState, useEffect, useMemo } from 'react';
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
    
    // Campi specifici Cerimoniale
    const [prerequisiti, setPrerequisiti] = useState(proposal?.prerequisiti || '');
    const [svolgimento, setSvolgimento] = useState(proposal?.svolgimento || '');
    const [effetto, setEffetto] = useState(proposal?.effetto || '');
    const [livelloCerimoniale, setLivelloCerimoniale] = useState(proposal?.livello || 1);

    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || '');
    
    // --- STATI LOGICA TIPO OGGETTO (Infusioni) ---
    const [selectedItemType, setSelectedItemType] = useState('');
    const [availableItemOptions, setAvailableItemOptions] = useState([]); 
    
    // --- STATI FILTRI E CONFIGURAZIONE ---
    const [selectedClasseId, setSelectedClasseId] = useState(''); 
    const [selectedSlots, setSelectedSlots] = useState([]);
    
    // Init componenti (Mattoni)
    const initialComponents = {};
    if (proposal?.componenti) {
        proposal.componenti.forEach(c => {
            const id = c.caratteristica?.id || c.caratteristica_id || c.caratteristica; 
            if(id) initialComponents[id] = c.valore;
        });
    }
    const [componentsMap, setComponentsMap] = useState(initialComponents);

    // Cache Dati
    const [allPunteggiCache, setAllPunteggiCache] = useState([]);
    const [availableAuras, setAvailableAuras] = useState([]);        
    const [availableInfusionAuras, setAvailableInfusionAuras] = useState([]); 
    const [availableCharacteristics, setAvailableCharacteristics] = useState([]);
    const [availableClassi, setAvailableClassi] = useState([]);   
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;
    const isInfusion = type === 'Infusione';
    const isCerimoniale = type === 'Cerimoniale';

    // Init Stato in fase di Edit
    useEffect(() => {
        if (proposal?.slot_corpo_permessi) {
            setSelectedSlots(proposal.slot_corpo_permessi.split(','));
        }
        if (isInfusion && proposal?.tipo_risultato_atteso) {
             // Logica di mapping inversa se necessaria
        }
    }, [proposal, isInfusion]);

    // 1. CARICAMENTO DATI INIZIALI
    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const allData = await getAllPunteggi();
                setAllPunteggiCache(allData);

                if (char && char.punteggi_base) {
                    // Filtro Aure per personaggio e tipo proposta
                    const validAuras = allData.filter(p => {
                        if (p.tipo !== 'AU') return false;
                        const val = char.punteggi_base[p.nome];
                        if (!val || val < 1) return false;
                        
                        if (isInfusion && !p.permette_infusioni) return false;
                        if (isCerimoniale && p.permette_cerimoniali === false) return false;
                        if (!isInfusion && !isCerimoniale && !p.permette_tessiture) return false;
                        
                        return true;
                    });
                    setAvailableAuras(validAuras);

                    // Filtro Caratteristiche
                    const validChars = allData.filter(p => {
                        if (p.tipo !== 'CA') return false;
                        // Cerimoniali: Scelta Libera. Altri: solo se possedute dal PG
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
                setError("Errore caricamento dati server.");
            } finally {
                setIsLoadingData(false);
            }
        };
        initData();
    }, [char, type, isInfusion, isCerimoniale]);

    // 2. CAMBIO AURA -> CALCOLO TIPI AMMESSI (Infusioni)
    useEffect(() => {
        if (!selectedAuraId || !isInfusion) {
            setAvailableItemOptions([]);
            return;
        }

        const auraObj = allPunteggiCache.find(p => p.id === parseInt(selectedAuraId));
        if (auraObj) {
            const options = [];
            if (auraObj.produce_mod) options.push('MOD');
            if (auraObj.produce_materia) options.push('MAT');
            if (auraObj.produce_innesti) options.push('INNESTO');
            if (auraObj.produce_mutazioni) options.push('MUTAZIONE');
            
            setAvailableItemOptions(options);

            // Selezione automatica del primo tipo disponibile se non coerente
            if (options.length > 0 && !options.includes(selectedItemType)) {
                setSelectedItemType(options[0]);
            } else if (options.length === 0) {
                setSelectedItemType('');
            }
        }
    }, [selectedAuraId, allPunteggiCache, isInfusion, selectedItemType]);

    // 3. LOGICA AURE INFUSIONE SECONDARIE
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


    // --- HANDLERS ---
    const handleTypeChange = (newType) => {
        setSelectedItemType(newType);
        const typeInfo = ITEM_TYPES[newType];
        if (typeInfo?.isBound) setSelectedClasseId('');
        else setSelectedSlots([]);
    };

    const isCharCompatible = (charId) => {
        if (!isInfusion || isCerimoniale) return true;
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

    // CALCOLO LIVELLO MAX CERIMONIALE
    const getMaxCerimonialeLevel = () => {
    if (!selectedAuraId || !char) return 0;
    
    // 1. Recupero Valore Aura (corretto)
    const auraObj = availableAuras.find(a => a.id == selectedAuraId);
    const auraVal = auraObj ? (char.punteggi_base[auraObj.nome] || 0) : 0;
    
    // 2. Recupero Valore CCO (CORRETTO: usa statistiche_primarie)
    const ccoStat = char.statistiche_primarie?.find(s => s.sigla === 'CCO');
    const ccoVal = ccoStat ? ccoStat.valore_corrente : 0;

    // Se CCO non è tra le primarie, il valore sarà 0 e il livello risulterà bloccato.
    // Assicurati che CCO sia "Is primaria" nel DB.
    return Math.min(auraVal, ccoVal);
};

    const getPayload = () => {
        const componentsArray = Object.entries(componentsMap).map(([id, val]) => ({
            caratteristica_id: parseInt(id), 
            valore: val
        }));
        
        let dbType = 'TES';
        if (isInfusion) dbType = 'INF';
        if (isCerimoniale) dbType = 'CER';

        const typeInfo = isInfusion ? ITEM_TYPES[selectedItemType] : null;
        const slotsToSave = (typeInfo?.isBound) ? selectedSlots.join(',') : '';
        const tipoRisultato = isInfusion ? (['INNESTO', 'MUTAZIONE'].includes(selectedItemType) ? 'AUM' : 'POT') : null;

        return {
            personaggio_id: selectedCharacterId,
            tipo: dbType,
            nome: name,
            descrizione: isCerimoniale ? "Cerimoniale Narrativo" : description,
            aura: selectedAuraId,
            aura_infusione: isInfusion ? selectedInfusionAuraId : null,
            tipo_risultato_atteso: tipoRisultato,
            componenti_data: componentsArray, 
            slot_corpo_permessi: slotsToSave,
            // Campi specifici Cerimoniale
            prerequisiti: isCerimoniale ? prerequisiti : null,
            svolgimento: isCerimoniale ? svolgimento : null,
            effetto: isCerimoniale ? effetto : null,
            livello: isCerimoniale ? livelloCerimoniale : null,
        };
    };

    const handleSaveAction = async (send = false) => {
        setError(''); 
        if (!name) return setError("Nome della tecnica obbligatorio.");
        if (!selectedAuraId) return setError("Seleziona un'Aura di riferimento.");
        
        if (isCerimoniale) {
            if (!prerequisiti || !svolgimento || !effetto) {
                return setError("Per i cerimoniali, tutti i campi descrittivi sono obbligatori.");
            }
            if (livelloCerimoniale < 1) return setError("Il livello deve essere almeno 1.");
        }

        setIsSaving(true);
        try {
            if (send && !window.confirm("Attenzione: l'invio alla valutazione dello staff è definitivo. Confermi?")) {
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
            setError(e.message || "Errore durante il salvataggio."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Vuoi davvero eliminare questa bozza? L'azione è irreversibile.")) return;
        try {
            await deleteProposta(proposal.id);
            onRefresh(); onClose();
        } catch (e) { setError(e.message); }
    };

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
    const currentTotalCount = Object.values(componentsMap).reduce((a, b) => a + b, 0);
    const estimatedCost = currentTotalCount * (isCerimoniale ? 100 : 10);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isInfusion ? <Box className="text-amber-500" size={20}/> : 
                         isCerimoniale ? <Users className="text-purple-400" size={20}/> :
                         <Scroll className="text-indigo-400" size={20}/>}
                        {isEditing ? `Modifica ${type}` : `Crea Nuova Proposta ${type}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && <div className="p-3 bg-red-900/30 text-red-200 rounded border border-red-800 flex items-center gap-2 animate-pulse"><AlertTriangle size={16}/> {error}</div>}

                    {/* RIGA 1: Identità */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome della Tecnica</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                disabled={!isDraft} 
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white mt-1.5 focus:border-indigo-500 outline-none transition-all" 
                                placeholder={`Inserisci nome ${type.toLowerCase()}...`} 
                            />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aura di Riferimento</label>
                            <select 
                                value={selectedAuraId} 
                                onChange={e => {setComponentsMap({}); setSelectedAuraId(e.target.value); setLivelloCerimoniale(1);}} 
                                disabled={!isDraft} 
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white mt-1.5 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="">-- Seleziona Aura --</option>
                                {availableAuras.map(a => <option key={a.id} value={a.id}>{a.nome} (Lv. {char.punteggi_base[a.nome] || 0})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* LOGICA CERIMONIALE: Livello e Testi */}
                    {isCerimoniale && selectedAuraId && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
                                <label className="text-[10px] font-black text-purple-400 uppercase flex justify-between items-center mb-2">
                                    Livello del Rituale
                                    <span className="text-gray-500 italic lowercase tracking-tight font-normal">Requisito Min(Aura, Coralità): {maxLivelloCerimoniale}</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <select 
                                        value={livelloCerimoniale} 
                                        onChange={e => setLivelloCerimoniale(parseInt(e.target.value))}
                                        className="w-32 bg-gray-800 border border-purple-500/40 rounded-lg p-2 text-white font-bold outline-none"
                                    >
                                        {[...Array(maxLivelloCerimoniale + 1).keys()].slice(1).map(n => (
                                            <option key={n} value={n}>Livello {n}</option>
                                        ))}
                                        {maxLivelloCerimoniale === 0 && <option value="0">Bloccato (Richiede coralità &gt; 0)</option>}
                                    </select>
                                    <p className="text-xs text-gray-400">Il livello determina la potenza narrativa e meccanica dell'effetto finale.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-purple-400 uppercase block mb-1.5">Prerequisiti Narrativi</label>
                                    <textarea 
                                        value={prerequisiti} 
                                        onChange={e => setPrerequisiti(e.target.value)} 
                                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white text-sm h-24 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600" 
                                        placeholder="Cosa occorre per iniziare il rito? (es: numero partecipanti, oggetti rari, luoghi o tempi specifici...)" 
                                        disabled={!isDraft} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5">Svolgimento del Rito</label>
                                    <textarea 
                                        value={svolgimento} 
                                        onChange={e => setSvolgimento(e.target.value)} 
                                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white text-sm h-40 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600" 
                                        placeholder="Descrivi dettagliatamente le fasi del cerimoniale e la narrazione corale richiesta..." 
                                        disabled={!isDraft} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-purple-400 uppercase block mb-1.5">Effetto Finale</label>
                                    <textarea 
                                        value={effetto} 
                                        onChange={e => setEffetto(e.target.value)} 
                                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white text-sm h-24 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600" 
                                        placeholder="Qual è il risultato meccanico o narrativo al termine del successo del cerimoniale?" 
                                        disabled={!isDraft} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOGICA INFUSIONI/TESSITURE: Meccaniche e Tipo Oggetto */}
                    {!isCerimoniale && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descrizione e Meccaniche</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    disabled={!isDraft} 
                                    className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white mt-1.5 focus:border-indigo-500 outline-none transition-all min-h-[100px]" 
                                    rows={4}
                                    placeholder="Definisci gli effetti, i bonus e le regole speciali..."
                                />
                            </div>

                            {isInfusion && selectedAuraId && (
                                <div className="p-5 bg-gray-800/40 rounded-2xl border border-gray-700/50 space-y-5">
                                    <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-2"><Settings size={18}/> Configurazione Tecnica Oggetto</h3>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {availableItemOptions.map(optKey => {
                                            const info = ITEM_TYPES[optKey];
                                            return (
                                                <button 
                                                    key={optKey} 
                                                    onClick={() => handleTypeChange(optKey)} 
                                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95 ${selectedItemType === optKey ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/20' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                                >
                                                    <info.icon size={15}/> {info.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {selectedItemType && (
                                        <div className="animate-in fade-in zoom-in-95 duration-300">
                                            {ITEM_TYPES[selectedItemType].isBound ? (
                                                <div>
                                                    <label className="text-[10px] font-black text-pink-400 uppercase block mb-3 ml-1">Slot Corporei Necessari all'Installazione</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {BODY_SLOTS.map(slot => (
                                                            <button 
                                                                key={slot.id} 
                                                                onClick={() => toggleSlot(slot.id)} 
                                                                className={`p-2.5 text-[10px] uppercase font-black rounded-lg border transition-all ${selectedSlots.includes(slot.id) ? 'bg-pink-900/40 border-pink-500 text-pink-200' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                                            >
                                                                {slot.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-[10px] font-black text-indigo-300 uppercase flex items-center gap-2 mb-2.5 ml-1"><Box size={14}/> Compatibilità Classe Oggetto</label>
                                                    <select 
                                                        className="w-full bg-gray-900 border border-indigo-500/30 rounded-xl p-2.5 text-white text-sm" 
                                                        value={selectedClasseId} 
                                                        onChange={e => setSelectedClasseId(e.target.value)}
                                                    >
                                                        <option value="">-- Mostra Tutte le Caratteristiche --</option>
                                                        {availableClassi.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEZIONE MATTONI (COMUNE A TUTTI) */}
                    {selectedAuraId && (
                        <div className="space-y-4 pt-2 border-t border-gray-800">
                            <div className="flex justify-between items-end">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Mattoni e Caratteristiche</label>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Seleziona i mattoni per comporre il potere della tecnica.</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Totale Mattoni: {currentTotalCount}</span>
                                    <span className="text-sm font-black text-yellow-500 font-mono tracking-tighter italic">Costo Invio: {estimatedCost} CR</span>
                                </div>
                            </div>

                            <div className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    {availableCharacteristics.map(charItem => {
                                        const count = componentsMap[charItem.id] || 0;
                                        const isCompatible = isCharCompatible(charItem.id);
                                        
                                        return (
                                            <div 
                                                key={charItem.id} 
                                                className={`flex items-center justify-between bg-gray-900 p-2.5 rounded-xl border transition-all ${count > 0 ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-gray-700'} ${!isCompatible ? 'opacity-20 pointer-events-none grayscale' : ''}`}
                                            >
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <IconaPunteggio punteggio={charItem} size="28px" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[11px] font-bold truncate text-gray-200">{charItem.nome}</span>
                                                        <span className="text-[8px] uppercase text-gray-500 font-black">{charItem.sigla}</span>
                                                    </div>
                                                </div>
                                                {isDraft && (
                                                    <div className="flex items-center gap-1.5 bg-gray-800 p-1 rounded-lg border border-gray-700">
                                                        {count > 0 && (
                                                            <button 
                                                                onClick={() => handleDecrement(charItem.id)} 
                                                                className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-red-900/40 rounded-md text-red-400 transition-colors"
                                                            >
                                                                <Minus size={14}/>
                                                            </button>
                                                        )}
                                                        {count > 0 && <span className="text-xs font-mono w-5 text-center text-white">{count}</span>}
                                                        <button 
                                                            onClick={() => handleIncrement(charItem.id)} 
                                                            className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-green-900/40 rounded-md text-green-400 transition-colors"
                                                        >
                                                            <Plus size={14}/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Chiamate API */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        {isDraft && isEditing ? (
                            <button 
                                onClick={handleDelete} 
                                className="text-red-400 text-xs font-bold flex items-center gap-1.5 hover:text-red-300 transition-colors"
                            >
                                <Trash2 size={15}/> Elimina Bozza
                            </button>
                        ) : <div/>}
                    </div>

                    <div className="flex gap-3">
                        {isDraft && (
                            <>
                                <button 
                                    onClick={() => handleSaveAction(false)} 
                                    disabled={isSaving} 
                                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-black uppercase flex gap-2 items-center transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={15}/>} 
                                    Salva Bozza
                                </button>
                                <button 
                                    onClick={() => handleSaveAction(true)} 
                                    disabled={isSaving || currentTotalCount === 0} 
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black uppercase flex gap-2 items-center shadow-lg shadow-green-900/30 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Send size={15}/>} 
                                    Invia allo Staff
                                </button>
                            </>
                        )}
                        {!isDraft && (
                            <button onClick={onClose} className="px-6 py-2.5 bg-gray-700 text-white rounded-xl text-xs font-black uppercase">Chiudi</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;