import React, { useState, useEffect } from 'react';
import { 
    getEventi, updateMostroHp, associaQrAVista,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest
} from '../api';
import { useCharacter } from './CharacterContext';
import { 
    Plus, Edit2, Trash2, Save, X, Clock, 
    Calendar, MapPin, Users, Swords, Eye, QrCode
} from 'lucide-react';

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(null); // 'evento', 'giorno', 'quest' o null
    const [formData, setFormData] = useState({});

    useEffect(() => { loadEventi(); }, []);

    const loadEventi = async () => {
        try {
            const data = await getEventi(onLogout);
            setEventi(data);
            if (data.length > 0) {
                // Mantieni selezionato l'evento corrente dopo il refresh se possibile
                const current = selectedEvento ? data.find(e => e.id === selectedEvento.id) : data[0];
                setSelectedEvento(current || data[0]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // --- LOGICA EDITING ---
    const startEdit = (tipo, oggetto = {}) => {
        setEditMode(tipo);
        setFormData(oggetto);
    };

    const handleSave = async () => {
        try {
            if (editMode === 'evento') {
                if (formData.id) await updateEvento(formData.id, formData, onLogout);
                else await createEvento(formData, onLogout);
            } else if (editMode === 'giorno') {
                const data = { ...formData, evento: selectedEvento.id };
                if (formData.id) await updateGiorno(formData.id, data, onLogout);
                else await createGiorno(data, onLogout);
            } else if (editMode === 'quest') {
                // Assicurati cheformData.giorno contenga l'ID corretto
                if (formData.id) await updateQuest(formData.id, formData, onLogout);
                else await createQuest(formData, onLogout);
            }
            setEditMode(null);
            loadEventi();
        } catch (e) { alert("Errore durante il salvataggio"); }
    };

    const handleDelete = async (tipo, id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo elemento?")) return;
        try {
            if (tipo === 'evento') await deleteEvento(id, onLogout);
            if (tipo === 'giorno') await deleteGiorno(id, onLogout);
            if (tipo === 'quest') await deleteQuest(id, onLogout);
            loadEventi();
        } catch (e) { alert("Errore durante l'eliminazione"); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Caricamento Plot...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 pb-20 text-white">
            {/* Header con Selettore Evento e Comandi Master */}
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-2 items-center mb-2">
                    <select 
                        className="flex-1 bg-gray-900 text-white p-2 rounded border border-gray-600"
                        value={selectedEvento?.id || ''}
                        onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id == e.target.value))}
                    >
                        {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
                    </select>
                    {isMaster && (
                        <>
                            <button onClick={() => startEdit('evento')} className="p-2 bg-emerald-600 rounded"><Plus size={18}/></button>
                            <button onClick={() => startEdit('evento', selectedEvento)} className="p-2 bg-indigo-600 rounded"><Edit2 size={18}/></button>
                        </>
                    )}
                </div>
                
                {selectedEvento && !editMode && (
                    <div className="text-xs text-gray-400 space-y-1">
                        <p className="italic">{selectedEvento.sinossi}</p>
                        <div className="flex gap-3 mt-2">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {selectedEvento.luogo}</span>
                            <span className="flex items-center gap-1 font-bold text-amber-500">PC: {selectedEvento.pc_guadagnati}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* FORM DI EDITING (Renderizzato al posto della lista se attivo) */}
            {isMaster && editMode && (
                <div className="p-4 bg-gray-800 border-b border-indigo-500 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold uppercase mb-4 text-indigo-400">
                        {formData.id ? 'Modifica' : 'Nuovo'} {editMode}
                    </h3>
                    <div className="space-y-3">
                        <input 
                            className="w-full bg-gray-900 p-2 rounded border border-gray-700"
                            placeholder="Titolo / Nome"
                            value={formData.titolo || formData.nome || ''}
                            onChange={e => setFormData({...formData, titolo: e.target.value, nome: e.target.value})}
                        />
                        <textarea 
                            className="w-full bg-gray-900 p-2 rounded border border-gray-700 h-24 text-sm"
                            placeholder="Descrizione / Sinossi"
                            value={formData.sinossi || formData.sinossi_breve || formData.descrizione_ampia || ''}
                            onChange={e => setFormData({...formData, sinossi: e.target.value, sinossi_breve: e.target.value, descrizione_ampia: e.target.value})}
                        />
                        <div className="flex gap-2">
                            <button onClick={handleSave} className="flex-1 bg-emerald-600 py-2 rounded font-bold flex items-center justify-center gap-2">
                                <Save size={18}/> Salva
                            </button>
                            <button onClick={() => setEditMode(null)} className="flex-1 bg-gray-700 py-2 rounded font-bold flex items-center justify-center gap-2">
                                <X size={18}/> Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Giorni e Quest */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {selectedEvento?.giorni.map(giorno => (
                    <div key={giorno.id} className="relative pl-4 border-l-2 border-emerald-500/30">
                        {/* Giorno Header */}
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-emerald-400 font-black text-lg">
                                    {new Date(giorno.data_ora_inizio).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </h2>
                                <p className="text-xs text-gray-500">{giorno.sinossi_breve}</p>
                            </div>
                            {isMaster && (
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit('quest', { giorno: giorno.id })} className="p-1.5 bg-emerald-900/50 text-emerald-400 rounded"><Plus size={14}/></button>
                                    <button onClick={() => startEdit('giorno', giorno)} className="p-1.5 bg-gray-800 text-gray-400 rounded"><Edit2 size={14}/></button>
                                </div>
                            )}
                        </div>

                        {/* Quests */}
                        <div className="space-y-4">
                            {giorno.quests.map(quest => (
                                <div key={quest.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                            <Clock size={14}/> {quest.orario_indicativo.slice(0,5)}
                                            <span className="text-white">— {quest.titolo}</span>
                                        </div>
                                        {isMaster && (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit('quest', quest)} className="text-indigo-400"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete('quest', quest.id)} className="text-red-400"><Trash2 size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4 whitespace-pre-wrap">{quest.descrizione_ampia}</p>
                                    
                                    {/* Componenti Quest (PnG, Mostri) - Visualizzazione Compatta */}
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-800">
                                            {quest.png_richiesti.length} PnG
                                        </span>
                                        <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800">
                                            {quest.mostri_presenti.length} Mostri
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlotTab;