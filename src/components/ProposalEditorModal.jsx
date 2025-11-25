import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, Trash2, AlertTriangle, Info, Plus, Minus } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { createProposta, updateProposta, sendProposta, deleteProposta, getAllPunteggi } from '../api';
import IconaPunteggio from './IconaPunteggio';

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // States
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    // currentBricks è un array di oggetti Punteggio (o simili)
    const [currentBricks, setCurrentBricks] = useState(proposal?.mattoni || []); 
    
    const [allPunteggiCache, setAllPunteggiCache] = useState([]); // Cache per tutti i punteggi
    const [availableAuras, setAvailableAuras] = useState([]);
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

                // Filtra Aure Possedute e Valide
                if (char && char.punteggi_base) {
                    const validAuras = allData.filter(p => {
                        if (p.tipo !== 'AU') return false;
                        
                        // Check Possesso (>0)
                        const val = char.punteggi_base[p.nome];
                        if (!val || val < 1) return false;

                        // Check Tipo Tecnica
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

    // 2. Gestione cambio Aura (Carica Mattoni e Obbligatori)
    useEffect(() => {
        if (!selectedAuraId || allPunteggiCache.length === 0) {
            setAvailableBricks([]);
            return;
        }

        // Filtra mattoni disponibili per questa aura
        let bricks = allPunteggiCache.filter(p => {
            // Deve essere un mattone
            if (!p.is_mattone) return false;
            // Deve appartenere all'aura selezionata
            if (p.aura_id !== parseInt(selectedAuraId)) return false; 
            return true;
        });

        // Filtra in base al Modello Aura (Proibiti)
        const modello = char?.modelli_aura?.find(m => m.aura === parseInt(selectedAuraId));
        
        if (modello) {
            // Rimuovi proibiti
            if (modello.mattoni_proibiti && modello.mattoni_proibiti.length > 0) {
                const proibitiIds = modello.mattoni_proibiti.map(m => m.id);
                bricks = bricks.filter(b => !proibitiIds.includes(b.id));
            }
        }

        // Filtra in base al possesso della caratteristica associata
        bricks = bricks.filter(b => {
            const carName = b.caratteristica_associata_nome;
            if (!carName) return true; 
            return (char.punteggi_base[carName] || 0) > 0;
        });

        setAvailableBricks(bricks);

        // GESTIONE OBBLIGATORI
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

    }, [selectedAuraId, allPunteggiCache, char, isDraft]);

    // --- NUOVO HANDLER PER IL CAMBIO AURA ---
    const handleAuraChange = (e) => {
        const newAuraId = e.target.value;
        
        // Se ci sono mattoni già selezionati, chiedi conferma prima di cancellarli
        if (currentBricks.length > 0) {
            const confirmChange = window.confirm("Cambiare aura rimuoverà i mattoni attuali. Continuare?");
            if (!confirmChange) {
                // Se l'utente annulla, non facciamo nulla (la select non cambia valore)
                return;
            }
            // Se conferma, svuota i mattoni
            setCurrentBricks([]);
        }
        
        // Imposta la nuova aura
        setSelectedAuraId(newAuraId);
    };

    // Handlers
    const handleAddBrick = (brick) => {
        if (currentBricks.length >= auraVal) {
            alert(`Hai raggiunto il limite di mattoni per questa aura (${auraVal}).`);
            return;
        }
        const carName = brick.caratteristica_associata_nome;
        if (carName) {
            const carVal = char.punteggi_base[carName] || 0;
            const existingCount = currentBricks.filter(b => b.id === brick.id).length;
            if (existingCount >= carVal) {
                alert(`Non puoi aggiungere più copie di questo mattone (Max: ${carVal} basato su ${carName}).`);
                return;
            }
        }
        setCurrentBricks([...currentBricks, { ...brick, is_mandatory: false }]);
    };

    const handleRemoveBrick = (index) => {
        const brick = currentBricks[index];
        if (brick.is_mandatory) {
            alert("Non puoi rimuovere un mattone obbligatorio per il tuo modello di aura.");
            return;
        }
        const newBricks = [...currentBricks];
        newBricks.splice(index, 1);
        setCurrentBricks(newBricks);
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
                mattoni_ids: currentBricks.map(b => b.id || b.mattone?.id)
            };

            if (isEditing) {
                await updateProposta(proposal.id, payload);
            } else {
                await createProposta(payload);
            }
            onRefresh();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = async () => {
        if (!window.confirm("Sei sicuro? Questo invio costerà crediti e renderà la proposta non modificabile.")) return;
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

    // Helper per UI
    const getAuraName = (id) => allPunteggiCache.find(p => p.id === parseInt(id))?.nome || 'Sconosciuta';
    const auraVal = char?.punteggi_base[getAuraName(selectedAuraId)] || 0;
    const bricksCount = currentBricks.length;
    const cost = bricksCount * 10;

    if (isLoadingData) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900 w-full max-w-5xl max-h-[95vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl">
                
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

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700/50 text-red-200 rounded flex items-center gap-2">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}

                    {/* Form Base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Nome</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                disabled={!isDraft}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none"
                                placeholder={`Nome della ${type}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Aura (Necessaria per i mattoni)</label>
                            <select 
                                value={selectedAuraId}
                                onChange={handleAuraChange} // <--- QUI LA CORREZIONE
                                disabled={!isDraft}         // <--- Rimosso il confirm da qui
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="">-- Seleziona Aura --</option>
                                {availableAuras.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome} (Valore: {char.punteggi_base[a.nome]})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Descrizione / Ragionamento</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={!isDraft}
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                            placeholder="Spiega come funziona la tecnica..."
                        />
                    </div>

                    {/* Builder Mattoni */}
                    <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden flex flex-col md:flex-row h-[500px] md:h-[400px]">
                        
                        {/* Colonna SX: Mattoni Disponibili */}
                        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
                            <div className="p-3 bg-gray-800 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase flex justify-between">
                                <span>Mattoni Disponibili</span>
                                {selectedAuraId && <span className="text-indigo-400">{getAuraName(selectedAuraId)}</span>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {!selectedAuraId ? (
                                    <div className="text-center text-gray-500 py-10 text-sm italic">Seleziona un'aura prima.</div>
                                ) : availableBricks.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10 text-sm">
                                        Nessun mattone disponibile per questa aura o requisiti non soddisfatti.
                                    </div>
                                ) : (
                                    availableBricks.map(brick => (
                                        <button 
                                            key={brick.id}
                                            onClick={() => isDraft && handleAddBrick(brick)}
                                            disabled={!isDraft}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-700 rounded text-left transition-colors group"
                                        >
                                            <div className="shrink-0"><IconaPunteggio url={brick.icona_url} color={brick.colore} size="xs" mode="cerchio" /></div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-gray-200">{brick.nome}</div>
                                                {brick.caratteristica_associata_nome && (
                                                    <div className="text-[10px] text-gray-500">Req: {brick.caratteristica_associata_nome}</div>
                                                )}
                                            </div>
                                            {isDraft && <Plus size={16} className="text-gray-500 group-hover:text-indigo-400" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Colonna DX: Mattoni Selezionati */}
                        <div className="w-full md:w-1/2 flex flex-col bg-gray-900/50">
                            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Composizione ({bricksCount}/{auraVal})</span>
                                <span className="text-xs text-gray-500">Costo: {cost} CR</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {currentBricks.length === 0 ? (
                                    <div className="text-center text-gray-600 py-10 text-sm italic">Aggiungi mattoni dalla lista.</div>
                                ) : (
                                    currentBricks.map((brick, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 shadow-sm animate-fadeIn">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600 font-mono text-xs w-4">{idx + 1}.</span>
                                                <IconaPunteggio 
                                                    url={brick.icona_url || brick.mattone?.icona_url} 
                                                    color={brick.colore || brick.mattone?.colore} 
                                                    size="xs" 
                                                />
                                                <span className="text-sm text-gray-200">{brick.nome || brick.mattone?.nome}</span>
                                                {brick.is_mandatory && (
                                                    <span className="text-[9px] bg-yellow-900/40 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-800">OBBL</span>
                                                )}
                                            </div>
                                            {isDraft && !brick.is_mandatory && (
                                                <button 
                                                    onClick={() => handleRemoveBrick(idx)}
                                                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between items-center shrink-0">
                    {isDraft && isEditing ? (
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs px-2 py-1 hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 size={14} /> Elimina
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        {isDraft ? (
                            <>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-2 transition-colors"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                                    Salva Bozza
                                </button>
                                <button 
                                    onClick={handleSend}
                                    disabled={isSaving || currentBricks.length === 0}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} /> Invia ({cost} CR)
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-400 italic text-sm px-2">
                                Proposta {proposal.stato.toLowerCase()}. Modifiche bloccate.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;