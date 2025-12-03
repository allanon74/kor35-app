import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Plus, Minus, Info } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { createProposta, updateProposta, sendProposta, deleteProposta, getAllPunteggi } from '../api';
import IconaPunteggio from './IconaPunteggio';

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // States
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || '');
    
    // Gestione componenti: Mappa { caratteristicaId: valore }
    // Se stiamo modificando una proposta esistente, convertiamo l'array componenti in mappa
    const initialComponents = {};
    if (proposal?.componenti) {
        proposal.componenti.forEach(c => {
            // Supporta sia il formato vecchio (oggetto completo) che nuovo (solo ID) se necessario
            const id = c.caratteristica?.id || c.caratteristica_id;
            initialComponents[id] = c.valore;
        });
    }
    const [componentsMap, setComponentsMap] = useState(initialComponents);

    // Cache dati
    const [allPunteggiCache, setAllPunteggiCache] = useState([]);
    const [availableAuras, setAvailableAuras] = useState([]);         
    const [availableInfusionAuras, setAvailableInfusionAuras] = useState([]); 
    const [availableCharacteristics, setAvailableCharacteristics] = useState([]);
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;
    const isInfusion = type === 'Infusione';

    // 1. Caricamento Iniziale
    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const allData = await getAllPunteggi();
                setAllPunteggiCache(allData);

                if (char && char.punteggi_base) {
                    // Filtra Aure disponibili per il PG
                    const validAuras = allData.filter(p => {
                        if (p.tipo !== 'AU') return false;
                        const val = char.punteggi_base[p.nome];
                        if (!val || val < 1) return false;
                        if (isInfusion && !p.permette_infusioni) return false;
                        if (!isInfusion && !p.permette_tessiture) return false;
                        return true;
                    });
                    setAvailableAuras(validAuras);

                    // Filtra Caratteristiche disponibili (CA con valore > 0)
                    const validChars = allData.filter(p => {
                        if (p.tipo !== 'CA') return false;
                        const val = char.punteggi_base[p.nome];
                        return val && val > 0;
                    });
                    setAvailableCharacteristics(validChars);
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

    // 2. Logica Aure Infusione
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
        
        // Auto-selezione se l'attuale non è valida
        if (validInfusionObjs.length > 0 && !allowedIds.includes(parseInt(selectedInfusionAuraId))) {
             setSelectedInfusionAuraId(validInfusionObjs[0].id);
        }
    }, [selectedAuraId, allPunteggiCache, isInfusion, selectedInfusionAuraId]);


    // --- HELPERS GRAFICI ---
    
    // Trova definizione Mattone per Aura+Caratteristica
    // Questo serve a capire qual è il "Mattone" associato (es. Fuoco) alla caratteristica (es. Forza) per l'aura selezionata.
    const findBrickDefinition = (auraId, charId) => {
        if (!auraId || !charId) return null;
        const charName = allPunteggiCache.find(c => c.id === parseInt(charId))?.nome;
        return allPunteggiCache.find(p => 
            p.is_mattone && 
            p.aura_id === parseInt(auraId) && 
            p.caratteristica_associata_nome === charName
        );
    };

    const getVisualInfo = (charObj) => {
        const primaryBrick = findBrickDefinition(selectedAuraId, charObj.id);
        const secondaryBrick = isInfusion ? findBrickDefinition(selectedInfusionAuraId, charObj.id) : null;
        
        return {
            charObj,
            primaryBrick,
            secondaryBrick,
        };
    };

    // --- HANDLERS ---
    
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

    // Prepara i dati per il backend
    const getPayload = () => {
        const componentsArray = Object.entries(componentsMap).map(([id, val]) => ({
            id: parseInt(id),
            valore: val
        }));

        return {
            personaggio_id: selectedCharacterId,
            tipo: isInfusion ? 'INF' : 'TES',
            nome: name,
            descrizione: description,
            aura: selectedAuraId,
            aura_infusione: isInfusion ? selectedInfusionAuraId : null,
            componenti_data: componentsArray
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

    // --- RENDER ---
    const getAuraName = (id) => allPunteggiCache.find(p => p.id === parseInt(id))?.nome || '...';
    const auraVal = char?.punteggi_base[getAuraName(selectedAuraId)] || 0;
    const currentTotalCount = Object.values(componentsMap).reduce((a, b) => a + b, 0);
    const cost = currentTotalCount * 10;

    // Check Regole Modello Aura (Solo visivo)
    const getRuleStatus = (charId) => {
        if (!selectedAuraId) return null;
        const modello = char?.modelli_aura?.find(m => m.aura === parseInt(selectedAuraId));
        if (!modello) return null;

        const brickDef = findBrickDefinition(selectedAuraId, charId);
        if (!brickDef) return null; // Se non c'è mattone, le regole sui mattoni non si applicano direttamente in questo modo semplice

        if (modello.mattoni_proibiti?.some(m => m.id === brickDef.id)) return { type: 'forbidden', text: 'Proibito' };
        if (modello.mattoni_obbligatori?.some(m => m.id === brickDef.id)) return { type: 'mandatory', text: 'Obbligatorio' };
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[95vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-bold text-white">
                        {isEditing ? `Modifica ${type}` : `Crea ${type}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {error && <div className="p-3 bg-red-900/30 text-red-200 rounded">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-400">Nome</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"/>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400">Aura Richiesta</label>
                            <select value={selectedAuraId} onChange={e => { setComponentsMap({}); setSelectedAuraId(e.target.value); }} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white">
                                <option value="">-- Seleziona --</option>
                                {availableAuras.map(a => <option key={a.id} value={a.id}>{a.nome} ({char.punteggi_base[a.nome]})</option>)}
                            </select>
                        </div>

                        {isInfusion && (
                            <div>
                                <label className="text-xs font-bold text-gray-400">Aura Infusione</label>
                                <select value={selectedInfusionAuraId} onChange={e => setSelectedInfusionAuraId(e.target.value)} disabled={!isDraft || !selectedAuraId} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white">
                                    <option value="">-- Nessuna --</option>
                                    {availableInfusionAuras.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400">Descrizione</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!isDraft} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" rows={2}/>
                    </div>

                    {/* Lista Caratteristiche / Mattoni */}
                    <div className="bg-gray-800/50 rounded border border-gray-700 p-2">
                        <div className="flex justify-between text-gray-400 text-xs mb-2 px-2 uppercase font-bold">
                            <span>Componenti ({currentTotalCount}/{selectedAuraId ? auraVal : '-'})</span>
                            <span>{cost} CR</span>
                        </div>
                        
                        <div className="space-y-2">
                            {availableCharacteristics.map(charObj => {
                                const { primaryBrick, secondaryBrick } = getVisualInfo(charObj);
                                const count = componentsMap[charObj.id] || 0;
                                const rule = getRuleStatus(charObj.id);
                                const isForbidden = rule?.type === 'forbidden';
                                
                                const hasPrimary = !!primaryBrick;
                                const hasSecondary = isInfusion && !!secondaryBrick;

                                return (
                                    <div key={charObj.id} className={`flex items-center justify-between p-2 rounded border ${count > 0 ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700'}`}>
                                        <div className="flex items-center gap-3">
                                            
                                            {/* SEZIONE ICONE */}
                                            <div className="flex items-center gap-2">
                                                {/* Caso 1: Solo Caratteristica */}
                                                {!hasPrimary && (
                                                    <div className="relative" title={charObj.nome}>
                                                        <IconaPunteggio url={charObj.icona_url} color={charObj.colore} size="xs" />
                                                    </div>
                                                )}

                                                {/* Caso 2 & 3: Mattone Primario (+ eventuale Secondario) */}
                                                {hasPrimary && (
                                                    <>
                                                        <div className="relative" title={`Richiesta: ${primaryBrick.nome}`}>
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

                                            {/* SEZIONE TESTO */}
                                            <div>
                                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                                    {/* Nome principale: Primario o Caratteristica */}
                                                    {hasPrimary ? primaryBrick.nome : charObj.nome}
                                                    
                                                    {/* Sigla Caratteristica: Sempre visibile se c'è un mattone */}
                                                    {hasPrimary && (
                                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1 py-0.5 rounded border border-gray-700" title={charObj.nome}>
                                                            {charObj.sigla}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Sottotitolo: Nome Secondo Mattone e/o Regole */}
                                                <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                                    {hasSecondary && <span>+ {secondaryBrick.nome}</span>}
                                                    
                                                    {rule && (
                                                        <span className={`${isForbidden ? 'text-red-400 font-bold' : 'text-yellow-400'}`}>
                                                            {rule.text}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* CONTROLLI +/- */}
                                        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded border border-gray-700">
                                            <button onClick={() => handleDecrement(charObj.id)} disabled={!isDraft || count === 0} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"><Minus size={12}/></button>
                                            <span className="w-6 text-center text-white font-mono">{count}</span>
                                            <button onClick={() => handleIncrement(charObj.id)} disabled={!isDraft || isForbidden} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"><Plus size={12}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between">
                    {isDraft && isEditing ? <button onClick={handleDelete} className="text-red-400 text-xs flex items-center gap-1"><Trash2 size={14}/> Elimina</button> : <div/>}
                    <div className="flex gap-2">
                        {isDraft && (
                            <>
                                <button onClick={() => handleSaveAction(false)} disabled={isSaving} className="px-3 py-2 bg-gray-700 text-white rounded text-sm flex gap-2 items-center"><Save size={14}/> Salva</button>
                                <button onClick={() => handleSaveAction(true)} disabled={isSaving || currentTotalCount === 0} className="px-3 py-2 bg-green-600 text-white rounded text-sm flex gap-2 items-center font-bold"><Send size={14}/> Invia</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;