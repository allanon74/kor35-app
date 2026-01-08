import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query'; // Import necessario per Optimistic UI
import { 
    createPersonaggio, 
    updatePersonaggio, 
    getTipologiePersonaggio,
    staffAddResources 
} from '../api';
import { useCharacter } from './CharacterContext';
import { 
    User, Users, Plus, Edit, Save, X, ShieldAlert, Coins, Zap 
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const PersonaggiTab = ({ onLogout, onSelectChar }) => {
    const { 
        personaggiList, 
        fetchPersonaggi, 
        refreshCharacterData, 
        isStaff, 
        isAdmin, 
        viewAll, 
        toggleViewAll, 
        selectCharacter,
        selectedCharacterId 
    } = useCharacter();

    const queryClient = useQueryClient(); // Hook per accedere alla cache

    // Stati Modale Edit/Create
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [tipologie, setTipologie] = useState([]);
    
    // Stati Modale Staff Risorse
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [resourceData, setResourceData] = useState({ charId: null, charName: '', tipo: 'crediti', amount: 0, reason: '' });

    useEffect(() => {
        getTipologiePersonaggio(onLogout).then(data => setTipologie(data));
        // fetchPersonaggi viene chiamato dal context, ma lo assicuriamo qui
        fetchPersonaggi();
    }, []);

    // --- LOGICA MODALE CREATE/EDIT ---

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ 
            nome: '', 
            tipologia: 1, 
            testo: '', 
            costume: '' 
        });
        setShowModal(true);
    };

    const handleOpenEdit = (char, e) => {
        e.stopPropagation(); 
        setEditMode(true);
        // Estrazione sicura dell'ID tipologia
        let tipoId = 1; // Fallback default (es. Standard)

        if (char.tipologia) {
            if (typeof char.tipologia === 'number') {
                // Caso perfetto: è già un ID
                tipoId = char.tipologia;
            } else if (typeof char.tipologia === 'object' && char.tipologia.id) {
                // Caso oggetto: estraiamo l'ID
                tipoId = char.tipologia.id;
            } else if (typeof char.tipologia === 'string') {
                // Caso stringa (es. "Vampiro"): Cerchiamo l'ID nella lista delle tipologie
                const found = tipologie.find(t => t.nome === char.tipologia);
                if (found) {
                    tipoId = found.id;
                } else {
                    // Estremo tentativo: la stringa è un numero ("2")?
                    const parsed = parseInt(char.tipologia, 10);
                    if (!isNaN(parsed)) tipoId = parsed;
                }
            }
        }
        setFormData({
            id: char.id,
            nome: char.nome,
            tipologia: tipoId,
            testo: char.testo || '',
            costume: char.costume || ''
        });
        setShowModal(true);
    };

    const handleSaveOptimistic = async () => {
        // Clona i dati
        const payload = { ...formData };
        
        // --- PULIZIA TIPOLOGIA ---
        if (payload.tipologia !== undefined && payload.tipologia !== null) {
            // Assicuriamoci che sia un intero
            const parsedTipo = parseInt(payload.tipologia, 10);
            
            if (!isNaN(parsedTipo)) {
                payload.tipologia = parsedTipo;
            } else {
                // Se non è un numero valido (es. NaN), rimuoviamolo per evitare l'errore 400.
                // In una modifica (PATCH), se manca il campo, il server tiene il valore vecchio.
                // In creazione (POST), userà il default del model o darà errore se obbligatorio, 
                // ma almeno non mandiamo null esplicito.
                delete payload.tipologia;
            }
        }
        
        const queryKey = ['personaggi_list', viewAll];
        const previousData = queryClient.getQueryData(queryKey);

        // Update Ottimistico UI
        queryClient.setQueryData(queryKey, (oldList = []) => {
            if (editMode) {
                return oldList.map(p => p.id === payload.id ? { ...p, ...payload } : p);
            } else {
                const tempId = 'temp-' + Date.now();
                // Aggiungiamo campi placeholder per evitare crash nella renderizzazione della lista
                return [...oldList, { 
                    ...payload, 
                    id: tempId, 
                    rango_label: '...', 
                    crediti: 0,
                    // Per la visualizzazione ottimistica immediata, se tipologia è un numero,
                    // cerchiamo il nome per mostrarlo corretto, altrimenti fallback
                    tipologia: tipologie.find(t => t.id === payload.tipologia)?.nome || payload.tipologia 
                }];
            }
        });

        setShowModal(false);

        try {
            if (editMode) {
                await updatePersonaggio(payload.id, payload, onLogout);
                if (String(payload.id) === String(selectedCharacterId)) {
                    refreshCharacterData();
                }
            } else {
                await createPersonaggio(payload, onLogout);
            }
            // Sincronizzazione reale
            await fetchPersonaggi();

        } catch (error) {
            console.error("Errore salvataggio:", error);
            alert("Errore nel salvataggio: " + error.message);
            // Rollback
            if (previousData) queryClient.setQueryData(queryKey, previousData);
        }
    };

    // --- LOGICA MODALE STAFF RISORSE ---

    const handleOpenResourceModal = (char, e) => {
        e.stopPropagation();
        setResourceData({ 
            charId: char.id, 
            charName: char.nome, 
            tipo: 'crediti', 
            amount: 0, 
            reason: 'Bonus Staff' 
        });
        setShowResourceModal(true);
    };

    const handleGiveResources = async () => {
        try {
            const resp = await staffAddResources(
                resourceData.charId, 
                resourceData.tipo, 
                parseInt(resourceData.amount), 
                resourceData.reason, 
                onLogout
            );
            alert(resp.msg || "Operazione completata");
            setShowResourceModal(false);
            fetchPersonaggi(); // Aggiorna i totali nella lista
        } catch (error) {
            alert("Errore: " + error.message);
        }
    };

    const handleSelect = (charId) => {
        if (String(charId).startsWith('temp-')) return; // Non selezionare elementi temporanei
        selectCharacter(charId);
        if (onSelectChar) onSelectChar();
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-4 overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black uppercase italic tracking-wider text-indigo-500">
                    Seleziona Personaggio
                </h2>
                
                <div className="flex gap-2">
                    {(isAdmin || isStaff) && (
                        <button 
                            onClick={toggleViewAll} 
                            className={`p-2 rounded-lg border ${viewAll ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                            title="Filtro Staff"
                        >
                            {viewAll ? <Users size={20}/> : <User size={20}/>}
                        </button>
                    )}
                    
                    <button 
                        onClick={handleOpenCreate} 
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-emerald-500 transition-colors shadow-lg"
                    >
                        <Plus size={16}/> Nuovo PG
                    </button>
                </div>
            </div>

            {/* LISTA PERSONAGGI */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-20 custom-scrollbar">
                {personaggiList.map(char => (
                    <div 
                        key={char.id} 
                        onClick={() => handleSelect(char.id)}
                        className={`relative group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                            ${selectedCharacterId === String(char.id) 
                                ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase bg-gray-700 text-gray-300`}>
                                {char.nome ? char.nome.charAt(0) : '?'}
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-lg leading-none">{char.nome}</h3>
                                {isStaff && (
                                    <div className="text-[10px] text-gray-400 mt-1 font-mono">
                                        CR: {char.crediti} | PC: {char.punti_caratteristica}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pulsanti Azione (Visibili solo a Staff/Admin) */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(isStaff || isAdmin) && (
                                <>
                                    <button 
                                        onClick={(e) => handleOpenResourceModal(char, e)}
                                        className="p-2 bg-amber-900/50 border border-amber-700 rounded-full text-amber-400 hover:bg-amber-800 transition-colors"
                                        title="Gestisci Risorse (Staff)"
                                    >
                                        <Coins size={16}/>
                                    </button>
                                    <button 
                                        onClick={(e) => handleOpenEdit(char, e)}
                                        className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white hover:bg-indigo-600 transition-colors"
                                        title="Modifica Anagrafica"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODALE EDIT/CREATE */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-3xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-black text-xl italic uppercase text-indigo-400">
                                {editMode ? 'Modifica Personaggio' : 'Nuovo Personaggio'}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white"/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <input 
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-xl font-bold text-white placeholder-gray-600"
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                                placeholder="Nome Personaggio"
                            />
                            
                            <RichTextEditor 
                                label="Background" 
                                value={formData.testo} 
                                onChange={val => setFormData({...formData, testo: val})}
                            />

                            {/* SEZIONE STAFF ONLY (Tipologia e Costume) */}
                            {isStaff && (
                                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 space-y-4 mt-4">
                                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
                                        <ShieldAlert size={14}/> Area Staff
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Tipologia</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                            value={formData.tipologia}
                                            onChange={e => setFormData({...formData, tipologia: parseInt(e.target.value)})}
                                        >
                                            {tipologie.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                    <RichTextEditor 
                                        label="Note Costume" 
                                        value={formData.costume} 
                                        onChange={val => setFormData({...formData, costume: val})}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <button 
                                onClick={handleSaveOptimistic}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold uppercase transition-colors"
                            >
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE STAFF RISORSE */}
            {showResourceModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-gray-800 w-full max-w-md rounded-2xl border border-amber-600 shadow-2xl p-6">
                        <h3 className="text-amber-500 font-bold text-lg uppercase mb-4 flex items-center gap-2">
                            <ShieldAlert size={20}/> Gestione Risorse: {resourceData.charName}
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setResourceData({...resourceData, tipo: 'crediti'})}
                                    className={`p-3 rounded-lg border font-bold transition-all ${resourceData.tipo === 'crediti' ? 'bg-amber-600 border-amber-500 text-white' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <Coins size={20}/> Crediti
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setResourceData({...resourceData, tipo: 'pc'})}
                                    className={`p-3 rounded-lg border font-bold transition-all ${resourceData.tipo === 'pc' ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <Zap size={20}/> Punti Caratt.
                                    </div>
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Quantità (+/-)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-xl text-center"
                                    value={resourceData.amount}
                                    onChange={e => setResourceData({...resourceData, amount: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Motivazione (Log)</label>
                                <input 
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                    placeholder="Es: Ricompensa Quest"
                                    value={resourceData.reason}
                                    onChange={e => setResourceData({...resourceData, reason: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button onClick={() => setShowResourceModal(false)} className="flex-1 py-2 bg-gray-700 rounded hover:bg-gray-600">Annulla</button>
                            <button onClick={handleGiveResources} className="flex-1 py-2 bg-emerald-600 rounded font-bold hover:bg-emerald-500">Conferma</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonaggiTab;