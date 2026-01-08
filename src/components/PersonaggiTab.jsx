import React, { useState, useEffect } from 'react';
import { 
    createPersonaggio, 
    updatePersonaggio, 
    getTipologiePersonaggio 
} from '../api';
import { useCharacter } from './CharacterContext';
import { 
    User, Users, Plus, Edit, Save, X, ShieldAlert 
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const PersonaggiTab = ({ onLogout, onSelectChar }) => {
    const { 
        personaggiList, 
        fetchPersonaggi, 
        refreshCharacterData, // Necessario per aggiornare la scheda dopo il salvataggio
        isStaff, 
        isAdmin, 
        viewAll, 
        toggleViewAll, 
        selectCharacter,
        selectedCharacterId 
    } = useCharacter();

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false); // false = create, true = edit
    const [formData, setFormData] = useState({});
    const [tipologie, setTipologie] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Carica le tipologie per il menu a tendina dello staff
        getTipologiePersonaggio(onLogout).then(data => setTipologie(data));
        fetchPersonaggi();
    }, [fetchPersonaggi, onLogout]);

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ 
            nome: '', 
            tipologia: 1, // Default: Standard
            testo: '',    // Utilizzato per il Background
            costume: ''   // Note tecniche sul costume
        });
        setShowModal(true);
    };

    const handleOpenEdit = (char, e) => {
        e.stopPropagation(); 
        setEditMode(true);
        setFormData({
            id: char.id,
            nome: char.nome,
            // Gestisce tipologia sia come oggetto (detail) che come stringa/id (list)
            tipologia: typeof char.tipologia === 'object' ? char.tipologia.id : (tipologie.find(t => t.nome === char.tipologia)?.id || 1),
            testo: char.testo || '',      // Background
            costume: char.costume || ''   // Costume
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = { ...formData };
            
            // Per il backend mappiamo 'tipologia' su 'tipologia_id' per scrivere correttamente la FK
            if (payload.tipologia) {
                payload.tipologia_id = payload.tipologia;
                delete payload.tipologia;
            }

            if (editMode) {
                await updatePersonaggio(formData.id, payload, onLogout);
            } else {
                await createPersonaggio(payload, onLogout);
            }

            // --- SINCRONIZZAZIONE DATI ---
            // Aggiorna la lista dei personaggi a sinistra
            await fetchPersonaggi();
            // Invalida la cache e ricarica i dettagli nel context globale (per aggiornare la scheda PG)
            await refreshCharacterData();
            
            setShowModal(false);
        } catch (error) {
            alert("Errore durante il salvataggio: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (charId) => {
        selectCharacter(charId);
        if (onSelectChar) onSelectChar();
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-4 overflow-hidden">
            {/* --- HEADER TAB --- */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black uppercase italic tracking-wider text-indigo-500">
                    Seleziona Personaggio
                </h2>
                
                <div className="flex gap-2">
                    {(isAdmin || isStaff) && (
                        <button 
                            onClick={toggleViewAll} 
                            className={`p-2 rounded-lg border ${viewAll ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                            title={viewAll ? "Vista Staff: Tutti i PG" : "Vista Player: I miei PG"}
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

            {/* --- LISTA PERSONAGGI --- */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-20 custom-scrollbar">
                {personaggiList.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 italic">
                        Nessun personaggio trovato.
                    </div>
                ) : (
                    personaggiList.map(char => (
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
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase
                                    ${char.tipologia !== 1 ? 'bg-amber-700 text-amber-100' : 'bg-gray-700 text-gray-300'}`}>
                                    {char.nome ? char.nome.charAt(0) : '?'}
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-lg leading-none">
                                        {char.nome}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-black/40 rounded text-gray-400">
                                            {char.rango_label || 'PG'}
                                        </span>
                                        {char.tipologia !== 1 && (
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-900/50 text-amber-400 border border-amber-800 rounded">
                                                PNG / NPC
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(isStaff || isAdmin) && (
                                <button 
                                    onClick={(e) => handleOpenEdit(char, e)}
                                    className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white hover:bg-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Edit size={16}/>
                                </button>
                            )}
                            
                            {selectedCharacterId === String(char.id) && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* --- MODALE EDIT/CREATE --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-3xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-black text-xl italic uppercase text-indigo-400 flex items-center gap-2">
                                {editMode ? 'Gestione Personaggio' : 'Nuovo Personaggio'}
                                {isStaff && <ShieldAlert size={18} className="text-amber-500" title="Modalità Staff Attiva"/>}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Nome Unico Ampio */}
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Nome Personaggio</label>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 focus:border-indigo-500 outline-none text-xl font-bold text-indigo-100 placeholder-gray-700"
                                    value={formData.nome}
                                    onChange={e => setFormData({...formData, nome: e.target.value})}
                                    placeholder="Inserisci il nome completo..."
                                />
                            </div>

                            {/* Background (Campo 'testo' del DB) */}
                            <div>
                                <RichTextEditor 
                                    label="Background / Storia" 
                                    value={formData.testo} 
                                    onChange={val => setFormData({...formData, testo: val})}
                                    placeholder="Scrivi qui la storia del tuo personaggio..."
                                />
                            </div>

                            {/* Sezione condizionale Staff */}
                            {isStaff && (
                                <div className="pt-6 border-t border-gray-700 space-y-6">
                                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                                        <ShieldAlert size={16}/>
                                        <span className="text-xs font-black uppercase tracking-widest italic">Opzioni Amministrative Staff</span>
                                    </div>

                                    {/* Selezione Tipologia */}
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Tipologia</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm outline-none cursor-pointer focus:border-amber-500"
                                            value={formData.tipologia}
                                            onChange={e => setFormData({...formData, tipologia: parseInt(e.target.value)})}
                                        >
                                            {tipologie.map(t => (
                                                <option key={t.id} value={t.id}>{t.nome}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Appunti Costume */}
                                    <div>
                                        <RichTextEditor 
                                            label="Note Tecniche Costume" 
                                            value={formData.costume} 
                                            onChange={val => setFormData({...formData, costume: val})}
                                            placeholder="Inserisci qui appunti sul costume, materiali o oggetti speciali..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                            <button 
                                onClick={handleSave} 
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2 animate-pulse"><Save size={18}/> Salvataggio in corso...</span>
                                ) : (
                                    <><Save size={18}/> Salva Modifiche</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonaggiTab;