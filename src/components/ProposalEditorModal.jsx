import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, Trash2, Plus, Minus, AlertTriangle, Info } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import IconaPunteggio from './IconaPunteggio';
import { createProposta, updateProposta, sendProposta, deleteProposta, getMattoniAura } from '../api';

const ProposalEditorModal = ({ proposal, type, onClose, onRefresh }) => {
    const { selectedCharacterData: char, selectedCharacterId } = useCharacter();
    
    // States
    const [name, setName] = useState(proposal?.nome || '');
    const [description, setDescription] = useState(proposal?.descrizione || '');
    const [selectedAuraId, setSelectedAuraId] = useState(proposal?.aura || '');
    const [currentBricks, setCurrentBricks] = useState(proposal?.mattoni || []); // Array di oggetti {id, nome, ...}
    
    const [availableAuras, setAvailableAuras] = useState([]);
    const [availableBricks, setAvailableBricks] = useState([]);
    const [loadingBricks, setLoadingBricks] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDraft = !proposal || proposal.stato === 'BOZZA';
    const isEditing = !!proposal;

    // 1. Carica Aure disponibili (quelle che il PG ha)
    useEffect(() => {
        if (char && char.punteggi_base) {
            // Filtra solo le aure con valore > 0
            const auras = Object.keys(char.punteggi_base)
                .filter(key => {
                     // Hacky check: assumiamo che il client sappia cos'è un aura o guardiamo i punteggi completi se disponibili
                     // Meglio usare l'array `modelli_aura` o una lista di Punteggi dal context se disponibile.
                     // Qui faccio un filtro euristico o uso una prop passata.
                     // Per robustezza, idealmente `useCharacter` dovrebbe dare la lista delle aure complete.
                     return true; 
                })
                // Nota: servono gli ID delle aure. Se `punteggi_base` ha solo nomi e valori, serve mappare sui dati completi.
                // Assumo che char.punteggi_base sia { "Fuoco": 5, ... } e debba trovare gli ID.
                // Faremo una chiamata API o useremo una lookup se disponibile.
                // Per semplicità qui assumo che `char.modelli_aura` contenga le aure possedute o userò una lista statica passata.
        }
        // Fetch di tutte le aure e filtro su quelle che il PG ha > 0
        const fetchAuras = async () => {
             // ... logica fetch aure, filtriamo quelle che il PG ha
             // MOCK per brevità: usiamo `proposal.aura_details` se editiamo, o un select vuoto da riempire
        };
        fetchAuras();
    }, [char]);

    // Carica mattoni quando cambia Aura
    useEffect(() => {
        if (!selectedAuraId) return;
        setLoadingBricks(true);
        // Qui dovresti chiamare l'API che ti da i mattoni per quell'aura
        // getMattoniAura(selectedAuraId)...
        // Poi filtriamo:
        // 1. Escludi proibiti (dati da char.modelli_aura per questa aura)
        // 2. Verifica che PG abbia caratteristica relativa >= 1
        setLoadingBricks(false);
    }, [selectedAuraId]);

    // Gestione Mattoni Obbligatori (al cambio aura o init)
    useEffect(() => {
        if (!isDraft) return; // Se non è bozza, non ricalcoliamo
        if (!selectedAuraId) return;

        const model = char.modelli_aura.find(m => m.aura === selectedAuraId);
        if (model && model.mattoni_obbligatori.length > 0) {
            // Aggiungi obbligatori se non presenti
            const mandatoryIds = model.mattoni_obbligatori.map(m => m.id);
            const currentIds = currentBricks.map(m => m.mattone?.id || m.id);
            
            const missing = model.mattoni_obbligatori.filter(m => !currentIds.includes(m.id));
            if (missing.length > 0) {
                 // Converti formato e aggiungi
                 const toAdd = missing.map(m => ({ ...m, is_mandatory: true })); // flag UI
                 setCurrentBricks(prev => [...prev, ...toAdd]);
            }
        }
    }, [selectedAuraId, char]);

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
                mattoni_ids: currentBricks.map(b => b.id || b.mattone.id)
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

    // Calcoli per validazione UI
    const auraVal = char.punteggi_base[ /* nome aura selezionata */ 'Fuoco' ] || 0; // Serve mappare ID -> Nome
    const bricksCount = currentBricks.length;
    const cost = bricksCount * 10;
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white">
                        {isEditing ? `Modifica Proposta ${type}` : `Nuova Proposta ${type}`}
                        {proposal && <span className="ml-3 text-xs uppercase px-2 py-1 rounded bg-gray-700 text-gray-300">{proposal.stato}</span>}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded">{error}</div>}

                    {/* Dati Base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Nome {type}</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                disabled={!isDraft}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Aura</label>
                            {/* Select Aura: Popolare con auras disponibili */}
                            <select 
                                value={selectedAuraId}
                                onChange={e => setSelectedAuraId(e.target.value)}
                                disabled={!isDraft}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                            >
                                <option value="">Seleziona Aura...</option>
                                {/* Mappa le aure disponibili qui */}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Ragionamento / Funzionamento</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={!isDraft}
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                            placeholder="Descrivi come funziona, perché rispetta l'aura scelta, etc..."
                        />
                    </div>

                    {/* Brick Builder */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                                <div className="w-2 h-6 bg-indigo-500 rounded-sm"></div>
                                Composizione Mattoni
                            </h3>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">Totale Mattoni: <span className={bricksCount > 5 ? "text-red-400" : "text-white"}>{bricksCount}</span> / {5 /* Max Aura */}</div>
                                <div className="text-xs text-gray-500">Costo Invio: {cost} CR</div>
                            </div>
                        </div>

                        {/* Area di lavoro Mattoni */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Lista Disponibili */}
                            <div className="bg-gray-900 p-3 rounded border border-gray-700 max-h-60 overflow-y-auto">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Mattoni Disponibili</div>
                                {isDraft ? (
                                    <div className="space-y-1">
                                        {/* Map availableBricks here */}
                                        <div className="text-gray-500 text-xs italic">Seleziona un'aura per caricare i mattoni...</div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-xs">Modifica disabilitata.</div>
                                )}
                            </div>

                            {/* Lista Selezionati (Sortable/Removable) */}
                            <div className="bg-gray-900 p-3 rounded border border-gray-700 max-h-60 overflow-y-auto">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Mattoni Scelti (Ordine conta)</div>
                                <ul className="space-y-2">
                                    {currentBricks.map((brick, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-mono text-xs">{idx + 1}.</span>
                                                <span className="text-sm">{brick.nome || brick.mattone?.nome}</span>
                                            </div>
                                            {isDraft && !brick.is_mandatory && (
                                                <button 
                                                    onClick={() => {
                                                        const newB = [...currentBricks];
                                                        newB.splice(idx, 1);
                                                        setCurrentBricks(newB);
                                                    }}
                                                    className="text-red-500 hover:text-red-300"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {brick.is_mandatory && <span className="text-[10px] text-yellow-500 bg-yellow-900/30 px-1 rounded">OBBL.</span>}
                                        </li>
                                    ))}
                                    {currentBricks.length === 0 && <li className="text-gray-600 text-xs text-center py-4">Nessun mattone aggiunto</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between items-center">
                    {isDraft && isEditing ? (
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm px-3 py-2">
                            <Trash2 size={16} /> Elimina Bozza
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        {isDraft && (
                            <>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2"
                                >
                                    <Save size={16} /> Salva Bozza
                                </button>
                                <button 
                                    onClick={handleSend}
                                    disabled={isSaving || currentBricks.length === 0}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2 font-bold shadow-lg shadow-green-900/20"
                                >
                                    <Send size={16} /> Invia ({cost} CR)
                                </button>
                            </>
                        )}
                        {!isDraft && (
                            <div className="px-4 py-2 text-gray-400 italic text-sm">
                                In stato: {proposal.stato}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalEditorModal;