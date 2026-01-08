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
        // Carica le tipologie (necessarie per la combo box dello staff)
        getTipologiePersonaggio(onLogout).then(data => setTipologie(data));
        fetchPersonaggi();
    }, [fetchPersonaggi, onLogout]);

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ 
            nome: '', 
            cognome: '', 
            tipologia: 1, // Default Standard
            testo: '',    // Campo Background
            costume: ''   // Appunti Costume
        });
        setShowModal(true);
    };

    const handleOpenEdit = (char, e) => {
        e.stopPropagation(); 
        setEditMode(true);
        setFormData({
            id: char.id,
            nome: char.nome,
            cognome: char.cognome || '',
            tipologia: char.tipologia?.id || char.tipologia, 
            testo: char.testo || '',      // Background
            costume: char.costume || ''   // Costume
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Se non è staff, rimuoviamo la tipologia dal payload per sicurezza/richiesta
            const payload = { ...formData };
            if (!isStaff && !editMode) {
                delete payload.tipologia;
            }

            if (editMode) {
                await updatePersonaggio(formData.id, payload, onLogout);
            } else {
                await createPersonaggio(payload, onLogout);
            }
            setShowModal(false);
            fetchPersonaggi(); 
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
                            title={viewAll ? "Mostra solo i miei" : "Mostra tutti (Staff)"}
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
                                    {char.nome.charAt(0)}
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-lg leading-none">
                                        {char.nome} <span className="text-gray-400 font-normal">{char.cognome}</span>
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

                            {/* Azioni: visibili se sei il proprietario o se sei Staff/Admin */}
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

            {/* --- MODALE CREAZIONE / EDIT --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-3xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-black text-xl italic uppercase text-indigo-400 flex items-center gap-2">
                                {editMode ? 'Modifica Personaggio' : 'Nuovo Personaggio'}
                                {isStaff && <ShieldAlert size={18} className="text-amber-500" title="Modalità Staff"/>}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Dati Anagrafici */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome</label>
                                    <input 
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-indigo-500 outline-none"
                                        value={formData.nome}
                                        onChange={e => setFormData({...formData, nome: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Cognome</label>
                                    <input 
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-indigo-500 outline-none"
                                        value={formData.cognome}
                                        onChange={e => setFormData({...formData, cognome: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Background (Sempre visibile) */}
                            <div>
                                <RichTextEditor 
                                    label="Background" 
                                    value={formData.testo} 
                                    onChange={val => setFormData({...formData, testo: val})}
                                    placeholder="Scrivi qui la storia del tuo personaggio..."
                                />
                            </div>

                            {/* Sezione Riservata allo Staff */}
                            {isStaff && (
                                <div className="pt-4 border-t border-gray-700 space-y-6">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <ShieldAlert size={16}/>
                                        <span className="text-xs font-bold uppercase tracking-widest">Opzioni Staff</span>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Tipologia Personaggio</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm outline-none"
                                            value={formData.tipologia}
                                            onChange={e => setFormData({...formData, tipologia: parseInt(e.target.value)})}
                                        >
                                            {tipologie.map(t => (
                                                <option key={t.id} value={t.id}>{t.nome}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <RichTextEditor 
                                            label="Appunti sul Costume" 
                                            value={formData.costume} 
                                            onChange={val => setFormData({...formData, costume: val})}
                                            placeholder="Inserisci qui le note tecniche sul costume del PG..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700">
                            <button 
                                onClick={handleSave} 
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                {loading ? <span className="animate-spin">...</span> : <><Save size={18}/> Salva Personaggio</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonaggiTab;