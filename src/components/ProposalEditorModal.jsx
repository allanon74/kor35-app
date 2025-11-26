import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Plus, Minus, Info, ArrowRight } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { createProposta, updateProposta, sendProposta, deleteProposta, getAllPunteggi } from '../api';
import IconaPunteggio from './IconaPunteggio';

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // States
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    
    // AURA 1: Il "Contenitore" (Definisce il limite massimo)
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    
    // AURA 2: Il "Contenuto" (Definisce quali mattoni caricare)
    // Se stiamo editando, potrebbe essere salvata in un campo specifico, 
    // altrimenti inizialmente è vuota o uguale alla principale.
    // NOTA: Se il backend non salva separatamente l'aura infusione, assumiamo che i mattoni salvati
    // appartengano implicitamente a quella logica. Qui aggiungo lo stato per gestirla in UI.
    const [selectedInfusionAuraId, setSelectedInfusionAuraId] = useState(proposal?.aura_infusione || ''); // Supponendo esista nel payload, altrimenti gestiamo sotto

    const [currentBricks, setCurrentBricks] = useState(proposal?.mattoni || []); 
    
    const [allPunteggiCache, setAllPunteggiCache] = useState([]);
    const [availableAuras, setAvailableAuras] = useState([]);         // Per la prima combo (Aura Richiesta)
    const [availableInfusionAuras, setAvailableInfusionAuras] = useState([]); // Per la seconda combo (Aura Infusione)
    const [availableBricks, setAvailableBricks] = useState([]);
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;

    // 1. Caricamento Iniziale Dati
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
                        if (type === 'Infusione' && !p.permette_infusioni) return false;
                        if (type === 'Tessitura' && !p.permette_tessiture) return false;
                        return true;
                    });
                    setAvailableAuras(validAuras);
                }
            } catch (e) {
                console.error(e);
                setError("Errore caricamento dati di base.");
            } finally {
                setIsLoadingData(false);
            }
        };
        initData();
    }, [char, type]);

    // 2. Gestione Logica AURA RICHIESTA -> AURA INFUSIONE
    useEffect(() => {
        if (!selectedAuraId || allPunteggiCache.length === 0) {
            setAvailableInfusionAuras([]);
            return;
        }

        // Trova l'oggetto Aura Richiesta
        const mainAuraObj = allPunteggiCache.find(p => p.id === parseInt(selectedAuraId));
        if (!mainAuraObj) return;

        // Recupera gli ID consentiti (dal campo M2M 'aure_infusione_consentite' aggiunto nel backend)
        // Fallback: se il campo non esiste o è vuoto, permetti solo se stessa.
        const allowedIds = mainAuraObj.aure_infusione_consentite || [mainAuraObj.id];

        // Filtra gli oggetti completi dalla cache
        const validInfusionObjs = allPunteggiCache.filter(p => allowedIds.includes(p.id));
        setAvailableInfusionAuras(validInfusionObjs);

        // Se l'aura di infusione attuale non è valida per la nuova aura richiesta, resettala
        // O se non è selezionata, seleziona la prima disponibile (default)
        if (!selectedInfusionAuraId || !allowedIds.includes(parseInt(selectedInfusionAuraId))) {
            if (validInfusionObjs.length > 0) {
                // Se è un edit esistente e l'aura_infusione non era salvata, 
                // potremmo voler cercare di "indovinare" dall'aura dei mattoni presenti, 
                // ma per semplicità selezioniamo la prima compatibile (spesso se stessa).
                setSelectedInfusionAuraId(validInfusionObjs[0].id);
            } else {
                setSelectedInfusionAuraId('');
            }
        }

    }, [selectedAuraId, allPunteggiCache, selectedInfusionAuraId]);


    // 3. Caricamento Mattoni (Basato su AURA INFUSIONE) e Obbligatori (Basato su MODELLO di Aura Richiesta)
    useEffect(() => {
        // I mattoni dipendono dall'AURA INFUSIONE selezionata
        if (!selectedInfusionAuraId || allPunteggiCache.length === 0) {
            setAvailableBricks([]);
            return;
        }

        // Filtra mattoni appartenenti all'Aura Infusione
        let bricks = allPunteggiCache.filter(p => {
            if (!p.is_mattone) return false;
            // Qui usiamo l'ID dell'aura di infusione, NON quella richiesta
            if (p.aura_id !== parseInt(selectedInfusionAuraId)) return false; 
            return true;
        });

        // NOTA: I mattoni proibiti/obbligatori dipendono dal Modello dell'Aura RICHIESTA (il contenitore)
        const modello = char?.modelli_aura?.find(m => m.aura === parseInt(selectedAuraId));
        
        if (modello && modello.mattoni_proibiti?.length > 0) {
            const proibitiIds = modello.mattoni_proibiti.map(m => m.id);
            bricks = bricks.filter(b => !proibitiIds.includes(b.id));
        }

        // Filtra per possesso caratteristica
        bricks = bricks.filter(b => {
            const carName = b.caratteristica_associata_nome;
            if (!carName) return true; 
            return (char.punteggi_base[carName] || 0) > 0;
        });

        setAvailableBricks(bricks);

        // GESTIONE OBBLIGATORI (Solo se nuova bozza e basati sull'Aura Richiesta)
        if (isDraft && modello && modello.mattoni_obbligatori) {
            const currentIds = currentBricks.map(b => b.id || b.mattone?.id);
            const missingMandatory = modello.mattoni_obbligatori.filter(
                m => !currentIds.includes(m.id)
            );

            if (missingMandatory.length > 0) {
                const toAdd = missingMandatory.map(m => {
                    const fullBrick = allPunteggiCache.find(p => p.id === m.id) || m;
                    return { ...fullBrick, is_mandatory: true };
                });
                
                setCurrentBricks(prev => {
                    const existingIds = new Set(prev.map(b => b.id));
                    const uniqueToAdd = toAdd.filter(b => !existingIds.has(b.id));
                    return [...prev, ...uniqueToAdd];
                });
            }
        }
    }, [selectedInfusionAuraId, selectedAuraId, allPunteggiCache, char, isDraft]);

    // Handler cambio Aura Richiesta
    const handleAuraChange = (e) => {
        const newAuraId = e.target.value;
        if (currentBricks.length > 0) {
            const confirmChange = window.confirm("Cambiare l'aura richiesta potrebbe invalidare i mattoni. Continuare e resettare?");
            if (!confirmChange) return;
            setCurrentBricks([]);
        }
        setSelectedAuraId(newAuraId);
        // La useEffect 2 scatterà e imposterà l'aura infusione di default
    };

    // Handler cambio Aura Infusione
    const handleInfusionAuraChange = (e) => {
        const newInfId = e.target.value;
        if (currentBricks.length > 0) {
            const confirmChange = window.confirm("Cambiare la fonte di infusione rimuoverà i mattoni attuali. Continuare?");
            if (!confirmChange) return;
            setCurrentBricks([]);
        }
        setSelectedInfusionAuraId(newInfId);
    };

    // --- LOGICA INCREMENTO (+) ---
    const handleIncrement = (brick) => {
        if (currentBricks.length >= auraVal) return; // Limite Aura Richiesta

        const carName = brick.caratteristica_associata_nome;
        if (carName) {
            const carVal = char.punteggi_base[carName] || 0;
            const existingCount = currentBricks.filter(b => (b.id || b.mattone?.id) === brick.id).length;
            if (existingCount >= carVal) return;
        }
        setCurrentBricks([...currentBricks, { ...brick, is_mandatory: false }]);
    };

    // --- LOGICA DECREMENTO (-) ---
    const handleDecrement = (brickId) => {
        const indices = currentBricks
            .map((b, i) => ((b.id || b.mattone?.id) === brickId ? i : -1))
            .filter(i => i !== -1);

        if (indices.length === 0) return;

        let indexToRemove = -1;
        const nonMandatoryIndex = indices.find(i => !currentBricks[i].is_mandatory);
        
        if (nonMandatoryIndex !== undefined) {
            indexToRemove = nonMandatoryIndex;
        } else {
            if (indices.length > 1) {
                indexToRemove = indices[indices.length - 1];
            } else {
                alert("Questo mattone è obbligatorio per il tuo modello di aura (minimo 1).");
                return;
            }
        }

        if (indexToRemove !== -1) {
            const newBricks = [...currentBricks];
            newBricks.splice(indexToRemove, 1);
            setCurrentBricks(newBricks);
        }
    };

    const handleSave = async () => {
        setError('');
        setIsSaving(true);
        try {
            const payload = {
                personaggio_id: selectedCharacterId,
                tipo: type === 'Tessitura' ? 'TES' : 'INF',
                nome: name,
                descrizione: description,
                aura: selectedAuraId,
                // Se il backend supporta il salvataggio dell'aura_infusione, aggiungila qui
                // aura_infusione: selectedInfusionAuraId, 
                mattoni_ids: currentBricks.map(b => b.id || b.mattone?.id)
            };

            if (isEditing) await updateProposta(proposal.id, payload);
            else await createProposta(payload);
            
            onRefresh();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = async () => {
        if (!window.confirm("Sei sicuro? Questo invio costerà crediti.")) return;
        try {
            await sendProposta(proposal.id);
            onRefresh();
            onClose();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Cancellare questa bozza?")) return;
        try {
            await deleteProposta(proposal.id);
            onRefresh();
            onClose();
        } catch (e) {
            setError(e.message);
        }
    };

    // Helpers UI
    const getAuraName = (id) => allPunteggiCache.find(p => p.id === parseInt(id))?.nome || '...';
    // Il valore massimo dipende dall'AURA RICHIESTA
    const auraVal = char?.punteggi_base[getAuraName(selectedAuraId)] || 0;
    const currentTotalCount = currentBricks.length;
    const cost = currentTotalCount * 10;

    const getBrickCount = (brickId) => currentBricks.filter(b => (b.id || b.mattone?.id) === brickId).length;
    
    const isBrickMandatory = (brickId) => {
        const modello = char?.modelli_aura?.find(m => m.aura === parseInt(selectedAuraId));
        return modello?.mattoni_obbligatori?.some(m => m.id === brickId);
    };

    if (isLoadingData) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[95vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        {isEditing ? `Modifica ${type}` : `Crea ${type}`}
                        {proposal && (
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
                                proposal.stato === 'BOZZA' ? 'bg-gray-700 border-gray-500' : 'bg-yellow-900 border-yellow-600 text-yellow-200'
                            }`}>
                                {proposal.stato}
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700/50 text-red-200 rounded flex items-center gap-2">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}

                    {/* Inputs Principali */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Nome</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                disabled={!isDraft}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        
                        {/* AURA RICHIESTA (Capienza) */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase flex items-center gap-2">
                                Aura Richiesta (Capienza)
                            </label>
                            <select 
                                value={selectedAuraId}
                                onChange={handleAuraChange}
                                disabled={!isDraft}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none mb-1"
                            >
                                <option value="">-- Seleziona --</option>
                                {availableAuras.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome} (Max: {char.punteggi_base[a.nome]})</option>
                                ))}
                            </select>
                            <div className="text-[10px] text-gray-500">
                                Definisce il numero massimo di mattoni utilizzabili.
                            </div>
                        </div>

                        {/* AURA INFUSIONE (Fonte Mattoni) */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 relative">
                             {/* Freccia visiva per indicare il flusso */}
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block text-gray-600">
                                <ArrowRight size={20} />
                            </div>

                            <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">
                                Aura Infusione (Fonte)
                            </label>
                            <select 
                                value={selectedInfusionAuraId}
                                onChange={handleInfusionAuraChange}
                                disabled={!isDraft || !selectedAuraId}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none mb-1"
                            >
                                {availableInfusionAuras.length === 0 && <option value="">-- Seleziona Aura Richiesta prima --</option>}
                                {availableInfusionAuras.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                ))}
                            </select>
                            <div className="text-[10px] text-gray-500">
                                Definisce quali mattoni (e di quale elemento) caricare.
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Descrizione</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={!isDraft}
                            rows={2}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                        />
                    </div>

                    {/* SEZIONE MATTONI */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden flex flex-col h-[450px]">
                        
                        {/* Info Bar */}
                        <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center shrink-0">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase">Composizione</span>
                                <span className={`text-sm font-mono ${currentTotalCount === auraVal ? 'text-green-400' : 'text-white'}`}>
                                    {currentTotalCount} / {selectedAuraId ? auraVal : '-'}
                                </span>
                            </div>
                             {selectedInfusionAuraId && (
                                <div className="text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30">
                                    Fonte: {getAuraName(selectedInfusionAuraId)}
                                </div>
                            )}
                            <div className="text-xs text-gray-500 text-right">
                                Costo<br/><span className="text-white font-mono">{cost} CR</span>
                            </div>
                        </div>

                        {/* Lista Mattoni */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {!selectedAuraId ? (
                                <div className="text-center text-gray-500 py-20 flex flex-col items-center gap-2">
                                    <Info size={32} />
                                    <span>Seleziona "Aura Richiesta" per iniziare.</span>
                                </div>
                            ) : !selectedInfusionAuraId ? (
                                <div className="text-center text-gray-500 py-20">
                                    Seleziona una "Aura Infusione".
                                </div>
                            ) : availableBricks.length === 0 ? (
                                <div className="text-center text-gray-500 py-20">
                                    Nessun mattone disponibile in {getAuraName(selectedInfusionAuraId)}.
                                </div>
                            ) : (
                                availableBricks.map(brick => {
                                    const count = getBrickCount(brick.id);
                                    const maxPerChar = brick.caratteristica_associata_nome 
                                        ? (char.punteggi_base[brick.caratteristica_associata_nome] || 0) 
                                        : 99;
                                    
                                    const isMandatory = isBrickMandatory(brick.id);
                                    
                                    // Logica: il limite totale dipende da AURA RICHIESTA (auraVal)
                                    // Il limite specifico dipende dalla Caratteristica
                                    const canAdd = isDraft && currentTotalCount < auraVal && count < maxPerChar;
                                    const canRemove = isDraft && count > 0 && (!isMandatory || count > 1);

                                    return (
                                        <div key={brick.id} className={`flex items-center justify-between p-3 rounded border transition-all ${
                                            count > 0 
                                                ? 'bg-indigo-900/20 border-indigo-500/50' 
                                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}>
                                            {/* Info Mattone */}
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="shrink-0">
                                                    <IconaPunteggio url={brick.icona_url} color={brick.colore} size="sm" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-200 flex items-center gap-2">
                                                        {brick.nome}
                                                        {isMandatory && <span className="text-[9px] bg-yellow-900 text-yellow-500 px-1 rounded border border-yellow-700">OBBL</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex gap-2">
                                                        {brick.caratteristica_associata_nome && (
                                                            <span>Max {maxPerChar} ({brick.caratteristica_associata_nome})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Controlli */}
                                            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-1 border border-gray-700">
                                                <button 
                                                    onClick={() => handleDecrement(brick.id)}
                                                    disabled={!canRemove}
                                                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                                                        canRemove ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                
                                                <span className={`w-6 text-center font-bold ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                                                    {count}
                                                </span>

                                                <button 
                                                    onClick={() => handleIncrement(brick)}
                                                    disabled={!canAdd}
                                                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                                                        canAdd ? 'text-indigo-400 hover:bg-indigo-900 hover:text-white' : 'text-gray-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between items-center shrink-0">
                    {isDraft && isEditing ? (
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs px-2 py-1">
                            <Trash2 size={14} /> Elimina
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        {isDraft ? (
                            <>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                                    Salva Bozza
                                </button>
                                <button 
                                    onClick={handleSend}
                                    disabled={isSaving || currentBricks.length === 0}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} /> Invia ({cost} CR)
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-400 italic text-sm px-2">
                                Stato: {proposal.stato}. Modifiche bloccate.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;