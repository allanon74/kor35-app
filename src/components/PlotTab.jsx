import React, { useState, useEffect } from 'react';
import { 
    getEventi, associaQrAVista, getRisorseEditor,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest,
    addPngToQuest, addMostroToQuest, addVistaToQuest,
    removePngFromQuest, removeMostroFromQuest, removeVistaFromQuest,
    fetchAuthenticated 
} from '../api';
import { useCharacter } from './CharacterContext';
import { Plus, X, Save } from 'lucide-react';
import EventoSection from './EventoSection';
import GiornoSection from './GiornoSection';
import QrTab from './QrTab';

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [risorse, setRisorse] = useState({ png: [], templates: [], manifesti: [], inventari: [], staff: [] });
    
    const [editMode, setEditMode] = useState(null); 
    const [formData, setFormData] = useState({});
    const [scanningForVista, setScanningForVista] = useState(null);

    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        try {
            const [evData, risData] = await Promise.all([getEventi(onLogout), getRisorseEditor(onLogout)]);
            setEventi(evData);
            setRisorse(risData);
            if (evData.length > 0) setSelectedEvento(evData[0]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const refreshData = async () => {
        const data = await getEventi(onLogout);
        setEventi(data);
        if (selectedEvento) {
            const updated = data.find(e => e.id === selectedEvento.id);
            setSelectedEvento(updated || data[0]);
        }
    };

    // FUNZIONI DI FORMATTAZIONE PER INPUT HTML5
    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0]; // Restituisce YYYY-MM-DD
    };

    const formatDateTimeForInput = (isoString) => {
        if (!isoString) return '';
        return isoString.slice(0, 16); // Restituisce YYYY-MM-DDTHH:mm
    };

    const formatTimeForInput = (timeString) => {
        if (!timeString) return '';
        return timeString.slice(0, 5); // Restituisce HH:mm
    };

    const handleUpdateEventoList = async (id, data) => {
    await updateEvento(id, data, onLogout);
    refreshData();
}

    const startEdit = (tipo, oggetto = {}) => {
        setEditMode(tipo);
        setFormData({ ...oggetto });
    };

    const handleSaveMain = async () => {
        try {
            if (editMode === 'evento') {
                if (formData.id) await updateEvento(formData.id, formData, onLogout);
                else await createEvento(formData, onLogout);
            } else if (editMode === 'giorno') {
                const data = { ...formData, evento: selectedEvento.id };
                if (formData.id) await updateGiorno(formData.id, data, onLogout);
                else await createGiorno(data, onLogout);
            } else if (editMode === 'quest') {
                if (formData.id) await updateQuest(formData.id, formData, onLogout);
                else await createQuest(formData, onLogout);
            }
            setEditMode(null);
            refreshData();
        } catch (e) { alert("Errore salvataggio."); console.error(e); }
    };

    const questHandlers = {
        onAddSub: async (tipo, payload) => {
            if (tipo === 'png') {
                const pId = parseInt(payload.personaggio);
                const stafferId = risorse.png.find(p => p.id === pId)?.proprietario;
                await addPngToQuest(parseInt(payload.quest), pId, stafferId, onLogout);
            }
            if (tipo === 'mostro') await addMostroToQuest(parseInt(payload.quest), parseInt(payload.template), parseInt(payload.staffer), onLogout);
            if (tipo === 'vista') {
                const vistaPayload = { quest: parseInt(payload.quest), tipo: payload.tipo, manifesto: payload.tipo === 'MAN' ? parseInt(payload.contentId) : null, inventario: payload.tipo === 'INV' ? parseInt(payload.contentId) : null };
                await addVistaToQuest(payload.quest, vistaPayload, onLogout);
            }
            refreshData();
        },
        onRemoveSub: async (tipo, id) => {
            if (tipo === 'png') await removePngFromQuest(id, onLogout);
            if (tipo === 'mostro') await removeMostroFromQuest(id, onLogout);
            if (tipo === 'vista') await removeVistaFromQuest(id, onLogout);
            if (tipo === 'quest') { if (window.confirm("Eliminare quest?")) await deleteQuest(id, onLogout); }
            refreshData();
        },
        onStatChange: async (id, field, delta) => {
            const m = selectedEvento.giorni.flatMap(g => g.quests).flatMap(q => q.mostri_presenti).find(mo => mo.id === id);
            await fetchAuthenticated(`/plot/api/mostri-istanza/${id}/`, { method: 'PATCH', body: JSON.stringify({ [field]: (m[field] || 0) + delta }) }, onLogout);
            refreshData();
        },
        onSaveNotes: async (id, note) => {
            await fetchAuthenticated(`/plot/api/mostri-istanza/${id}/`, { method: 'PATCH', body: JSON.stringify({ note_per_staffer: note }) }, onLogout);
            alert("Note salvate"); refreshData();
        },
        onScanQr: (id) => setScanningForVista(id)
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-20 overflow-hidden">
            {/* Header Selezione Evento */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex gap-2 z-40 shadow-xl">
                <select className="flex-1 bg-gray-900 p-3 rounded-xl border border-gray-800 font-black text-indigo-400 outline-none"
                    value={selectedEvento?.id || ''} onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}>
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo.toUpperCase()}</option>)}
                </select>
                {isMaster && (
                    <button onClick={() => startEdit('evento')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg"><Plus size={24}/></button>
                )}
            </div>

            {/* AREA EDITOR DINAMICA */}
            {editMode && (
                <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-2xl border-t-4 border-indigo-500 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase text-indigo-400 italic tracking-widest">Editor {editMode}</h3>
                            <button onClick={() => setEditMode(null)} className="p-2 hover:bg-gray-700 rounded-full"><X/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editMode === 'evento' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo Evento</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 focus:border-indigo-500 outline-none" 
                                            value={formData.titolo || ''} onChange={e => setFormData({...formData, titolo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Data Inizio</label>
                                        <input type="date" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formatDateForInput(formData.data_inizio)} onChange={e => setFormData({...formData, data_inizio: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Data Fine</label>
                                        <input type="date" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formatDateForInput(formData.data_fine)} onChange={e => setFormData({...formData, data_fine: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Luogo</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.luogo || ''} onChange={e => setFormData({...formData, luogo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">PC Guadagnati</label>
                                        <input type="number" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.pc_guadagnati || 0} onChange={e => setFormData({...formData, pc_guadagnati: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Sinossi Estesa</label>
                                        <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-32 resize-none" 
                                            value={formData.sinossi || ''} onChange={e => setFormData({...formData, sinossi: e.target.value})} />
                                    </div>
                                </>
                            )}

                            {editMode === 'giorno' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Sinossi Breve Giorno</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.sinossi_breve || ''} onChange={e => setFormData({...formData, sinossi_breve: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Inizio (Data e Ora)</label>
                                        <input type="datetime-local" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formatDateTimeForInput(formData.data_ora_inizio)} onChange={e => setFormData({...formData, data_ora_inizio: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Fine (Data e Ora)</label>
                                        <input type="datetime-local" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formatDateTimeForInput(formData.data_ora_fine)} onChange={e => setFormData({...formData, data_ora_fine: e.target.value})} />
                                    </div>
                                </>
                            )}

                            {editMode === 'quest' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo Quest</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.titolo || ''} onChange={e => setFormData({...formData, titolo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Orario Indicativo</label>
                                        <input type="time" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formatTimeForInput(formData.orario_indicativo)} onChange={e => setFormData({...formData, orario_indicativo: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Descrizione Ampia</label>
                                        <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-32 resize-none" 
                                            value={formData.descrizione_ampia || ''} onChange={e => setFormData({...formData, descrizione_ampia: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Materiale di Scena (Props)</label>
                                        <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-20 resize-none" 
                                            value={formData.props || ''} onChange={e => setFormData({...formData, props: e.target.value})} />
                                    </div>
                                </>
                            )}
                        </div>

                        <button onClick={handleSaveMain} className="w-full mt-6 bg-indigo-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                            <Save size={20}/> Salva {editMode}
                        </button>
                    </div>
                </div>
            )}

            {/* Area Contenuto */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedEvento && (
                    <EventoSection 
                        evento={selectedEvento} 
                        isMaster={isMaster} 
                        risorse={risorse}
                        onEdit={startEdit} 
                        onDelete={deleteEvento}
                        onUpdateEvento={handleUpdateEventoList}
                        onAddGiorno={() => startEdit('giorno')}
                    />
                )}

                <div className="p-4 space-y-16">
                    {selectedEvento?.giorni.map((giorno, gIdx) => (
                        <GiornoSection key={giorno.id} giorno={giorno} gIdx={gIdx} isMaster={isMaster} risorse={risorse}
                            onEdit={startEdit} onDelete={deleteGiorno} 
                            onAddQuest={(gid) => startEdit('quest', { giorno_evento: gid })}
                            questHandlers={questHandlers} />
                    ))}
                </div>
            </div>

            {/* Modal Scanner QR */}
            {scanningForVista && (
                <div className="fixed inset-0 z-110 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800">
                        <span className="font-black text-white uppercase italic tracking-widest">Associa QR Fisico</span>
                        <button onClick={() => setScanningForVista(null)} className="px-4 py-2 bg-red-600 rounded-lg text-xs font-black">X ANNULLA</button>
                    </div>
                    <div className="flex-1">
                        <QrTab onScanSuccess={async (qr_id) => {
                            await associaQrAVista(scanningForVista, qr_id, onLogout);
                            setScanningForVista(null); refreshData();
                        }} onLogout={onLogout} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlotTab;