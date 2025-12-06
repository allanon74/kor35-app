import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Plus, Minus, Info, Box } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { createProposta, updateProposta, sendProposta, deleteProposta, getAllPunteggi, getMattoniAura, getClassiOggetto } from '../api';
import IconaPunteggio from './IconaPunteggio';

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // States Dati
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || '');
    
    // --- NUOVO STATO: Classe Oggetto Selezionata ---
    const [selectedClasseId, setSelectedClasseId] = useState('');
    const [availableClassi, setAvailableClassi] = useState([]);
    
    // Gestione componenti: Mappa { caratteristicaId: valore }
    const initialComponents = {};
    if (proposal?.componenti) {
        proposal.componenti.forEach(c => {
            const id = c.caratteristica?.id || c.caratteristica_id || c.caratteristica; // Supporto robusto ID
            if(id) initialComponents[id] = c.valore;
        });
    }
    const [componentsMap, setComponentsMap] = useState(initialComponents);

    // Cache dati
    const [allPunteggiCache, setAllPunteggiCache] = useState([]);
    const [availableAuras, setAvailableAuras] = useState([]);        
    const [availableInfusionAuras, setAvailableInfusionAuras] = useState([]); 
    const [availableCharacteristics, setAvailableCharacteristics] = useState([]);
    const [availableMattoni, setAvailableMattoni] = useState([]); // Mattoni dell'aura selezionata
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;
    const isInfusion = type === 'Infusione';

    // 1. Caricamento Iniziale (Punteggi e Classi)
    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                // Carica Punteggi
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

                // --- NUOVO: Carica Classi Oggetto (Solo se Infusione) ---
                if (isInfusion) {
                    const classi = await getClassiOggetto();
                    setAvailableClassi(classi || []);
                }

            } catch (e) {
                console.error(e);
                setError("Errore caricamento dati di base.");
            } finally {
                setIsLoadingData(false);
            }
        };
        initData();
    }, [char, type, isInfusion]);

    // 2. Caricamento Mattoni per Aura Selezionata
    useEffect(() => {
        if (!selectedAuraId) {
            setAvailableMattoni([]);
            return;
        }
        const loadMattoni = async () => {
            try {
                const mattoni = await getMattoniAura(selectedAuraId);
                setAvailableMattoni(mattoni || []);
            } catch(e) { console.error(e); }
        };
        loadMattoni();
    }, [selectedAuraId]);

    // 3. Logica Aure Infusione (Secondaria)
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


    // --- NUOVA FUNZIONE: CHECK COMPATIBILITÀ MATTONE ---
    const isCharCompatibleWithClass = (charId) => {
        if (!selectedClasseId || !isInfusion) return true; // Nessun filtro attivo

        const classeObj = availableClassi.find(c => c.id == selectedClasseId);
        if (!classeObj) return true;

        // Determina se l'aura selezionata è "Tecnologica" o "Mondana"
        // (Logica euristica basata sul nome, adattala se hai un flag is_tecnologico)
        const auraObj = availableAuras.find(a => a.id == selectedAuraId);
        const isTecno = auraObj?.nome?.toLowerCase().includes("tecnolog");
        
        // Se è Tecno -> Controlla lista Mod
        if (isTecno) {
            return classeObj.mod_allowed_ids.includes(parseInt(charId));
        } 
        // Se è Mondano -> Controlla lista Materie
        else {
            return classeObj.materia_allowed_ids.includes(parseInt(charId));
        }
    };


    // --- HELPERS GRAFICI ---
    
    const findBrickDefinition = (auraId, charId) => {
        // Cerca nei mattoni caricati se appartengono a questa aura
        // (Ottimizzazione: usiamo availableMattoni se l'auraId corrisponde a quella selezionata)
        if (parseInt(auraId) === parseInt(selectedAuraId)) {
            return availableMattoni.find(m => m.caratteristica?.id === parseInt(charId));
        }
        // Fallback su cache globale se necessario (o ritorna null se non caricati)
        return null; 
    };

    const getVisualInfo = (charObj) => {
        // Cerchiamo se esiste un mattone definito per questa coppia Aura-Caratteristica
        const primaryBrick = findBrickDefinition(selectedAuraId, charObj.id);
        // Per la secondaria è più complesso perché non abbiamo caricato i suoi mattoni specifici
        // ma possiamo assumere che esista se l'aura secondaria è valida.
        const secondaryBrick = null; // Semplificazione visiva
        
        return { charObj, primaryBrick, secondaryBrick };
    };

    // --- HANDLERS ---
    
    const getAuraName = (id) => allPunteggiCache.find(p => p.id === parseInt(id))?.nome || '...';
    const auraVal = char?.punteggi_base[getAuraName(selectedAuraId)] || 0;
    const currentTotalCount = Object.values(componentsMap).reduce((a, b) => a + b, 0);

    const handleIncrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        const charName = allPunteggiCache.find(p => p.id === charId)?.nome;
        const maxVal = char.punteggi_base[charName] || 0;
        
        if (currentVal < maxVal && currentTotalCount < auraVal) {
            setComponentsMap({ ...componentsMap, [charId]: currentVal + 1 });
        }
    };

    const handleDecrement = (charId) => {
        const currentVal = componentsMap[charId] || 0;
        if (currentVal > 0) {
            const newMap = { ...componentsMap, [charId]: currentVal - 1 };
            if (newMap[charId] === 0) delete newMap[charId];
            setComponentsMap(newMap);
        }
    };

    const getPayload = () => {
        const componentsArray = Object.entries(componentsMap).map(([id, val]) => ({
            caratteristica: parseInt(id), // Backend aspetta 'caratteristica' (ID)
            valore: val
        }));

        return {
            personaggio_id: selectedCharacterId,
            tipo: isInfusion ? 'INF' : 'TES',
            nome: name,
            descrizione: description,
            aura: selectedAuraId,
            aura_infusione: isInfusion ? selectedInfusionAuraId : null,
            componenti: componentsArray // Nota: Il backend usa 'componenti' nel serializer
        };
    };

    const handleSaveAction = async (send = false) => {
        setError(''); setIsSaving(true);
        try {
            if (send && !window.confirm("Invio definitivo? Costa crediti.")) {
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
        if (!window.confirm("Cancellare questa bozza?")) return;
        try {
            await deleteProposta(proposal.id);
            onRefresh(); onClose();
        } catch (e) { setError(e.message); }
    };

    // --- RENDER ---
    const cost = currentTotalCount * 10;

    const getRuleStatus = (charId) => {
        if (!selectedAuraId) return null;
        const modello = char?.modelli_aura?.find(m => m.aura === parseInt(selectedAuraId));
        if (!modello) return null;
        // Nota: Questo check richiederebbe i mattoni caricati nel modello.
        // Se modello.mattoni_proibiti contiene oggetti completi, ok.
        // Altrimenti serve logica più complessa.
        // Per ora lasciamo invariato se funzionava.
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[95vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl animate-fadeIn">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isInfusion ? <Box size={20} className="text-amber-500"/> : <Info size={20} className="text-indigo-400"/>}
                        {isEditing ? `Modifica ${type}` : `Crea ${type}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    
                    {/* --- NUOVA SEZIONE: FILTRO CLASSE OGGETTO --- */}
                    {isInfusion && selectedAuraId && (
                        <div className="bg-indigo-900/10 border border-indigo-500/30 p-3 rounded-lg flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1 mb-1">
                                    <Box size={14}/> Progetta per Classe Oggetto
                                </label>
                                <select 
                                    value={selectedClasseId} 
                                    onChange={e => setSelectedClasseId(e.target.value)} 
                                    className="w-full bg-gray-900 border border-indigo-500/50 rounded p-2 text-sm text-white"
                                >
                                    <option value="">-- Mostra tutti i componenti --</option>
                                    {availableClassi.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-xs text-indigo-400/80 max-w-xs">
                                Seleziona una classe (es. "Arma da Fuoco") per evidenziare solo i componenti compatibili.
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Descrizione</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mt-1" rows={2}/>
                    </div>

                    {/* Lista Caratteristiche / Mattoni */}
                    <div className="bg-gray-800/50 rounded border border-gray-700 p-2">
                        <div className="flex justify-between text-gray-400 text-xs mb-2 px-2 uppercase font-bold">
                            <span>Componenti ({currentTotalCount}/{selectedAuraId ? auraVal : '-'})</span>
                            <span>{cost} CR</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {availableCharacteristics.map(charObj => {
                                const { primaryBrick, secondaryBrick } = getVisualInfo(charObj);
                                const count = componentsMap[charObj.id] || 0;
                                
                                // --- LOGICA VISIVA FILTRO ---
                                const isCompatible = isCharCompatibleWithClass(charObj.id);
                                const opacityClass = isCompatible ? 'opacity-100' : 'opacity-30 grayscale';
                                // -----------------------------

                                const hasPrimary = !!primaryBrick;
                                const hasSecondary = isInfusion && !!secondaryBrick;

                                return (
                                    <div key={charObj.id} className={`flex items-center justify-between p-2 rounded border transition-all ${count > 0 ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700'} ${opacityClass}`}>
                                        <div className="flex items-center gap-3">
                                            
                                            {/* ICONE */}
                                            <div className="flex items-center gap-2">
                                                {!hasPrimary && (
                                                    <div className="relative" title={charObj.nome}>
                                                        <IconaPunteggio url={charObj.icona_url} color={charObj.colore} size="xs" />
                                                    </div>
                                                )}
                                                {hasPrimary && (
                                                    <>
                                                        <div className="relative" title={`Mattone: ${primaryBrick.nome}`}>
                                                            <IconaPunteggio url={primaryBrick.icona_url} color={primaryBrick.colore} size="xs" />
                                                        </div>
                                                        {hasSecondary && (
                                                            <div className="relative" title={`Infusione: ${secondaryBrick.nome}`}>
                                                                <IconaPunteggio url={secondaryBrick.icona_url} color={secondaryBrick.colore} size="xs" />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* TESTO */}
                                            <div>
                                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                                    {hasPrimary ? primaryBrick.nome : charObj.nome}
                                                    {hasPrimary && (
                                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1 py-0.5 rounded border border-gray-700" title={charObj.nome}>
                                                            {charObj.sigla}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isCompatible && (
                                                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Non Compatibile</div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* CONTROLLI +/- */}
                                        {/* Disabilitati se non compatibile (Opzionale: puoi lasciare abilitato ma con warning) */}
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