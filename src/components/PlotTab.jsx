import React, { useState, useEffect } from 'react';
import { 
    getEventi, associaQrAVista, getRisorseEditor,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest,
    addPngToQuest, removePngFromQuest,
    addMostroToQuest, removeMostroFromQuest,
    addVistaToQuest, removeVistaFromQuest,
    fetchAuthenticated 
} from '../api';
import { useCharacter } from './CharacterContext';
import { Plus, Edit2, Trash2, Save, X, MapPin, Info, QrCode as QrIcon } from 'lucide-react';
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
        if (selectedEvento) setSelectedEvento(data.find(e => e.id === selectedEvento.id) || data[0]);
    };

    const startEdit = (tipo, oggetto = {}) => {
        setEditMode(tipo);
        setFormData(oggetto);
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
                const data = { ...formData }; // giorno_evento viene già dal form se stiamo creando
                if (formData.id) await updateQuest(formData.id, data, onLogout);
                else await createQuest(data, onLogout);
            }
            setEditMode(null);
            refreshData();
        } catch (e) { alert("Errore salvataggio."); }
    };

    const handleDeleteMain = async (tipo, id) => {
        if (!window.confirm(`Eliminare questo ${tipo}?`)) return;
        try {
            if (tipo === 'evento') { await deleteEvento(id, onLogout); setSelectedEvento(null); }
            if (tipo === 'giorno') await deleteGiorno(id, onLogout);
            if (tipo === 'quest') await deleteQuest(id, onLogout);
            refreshData();
        } catch (e) { alert("Errore eliminazione."); }
    };

    // Handlers per le Quest passati ai figli
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
            if (tipo === 'quest') await handleDeleteMain('quest', id);
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
                <select className="flex-1 bg-gray-900 p-3 rounded-xl border border-gray-800 font-black text-indigo-400 outline-none appearance-none cursor-pointer"
                    value={selectedEvento?.id || ''} onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}>
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo.toUpperCase()}</option>)}
                </select>
                {isMaster && (
                    <div className="flex gap-2">
                        <button onClick={() => startEdit('evento', selectedEvento)} className="p-3 bg-gray-800 rounded-xl text-indigo-400"><Edit2 size={24}/></button>
                        <button onClick={() => startEdit('evento')} className="p-3 bg-indigo-600 rounded-xl"><Plus size={24}/></button>
                    </div>
                )}
            </div>

            {/* Editor Modale */}
            {editMode && (
                <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-xl border-t-4 border-indigo-500 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase text-indigo-400 italic">Editor {editMode}</h3>
                            <button onClick={() => setEditMode(null)}><X/></button>
                        </div>
                        <div className="space-y-4">
                            <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" placeholder="Titolo / Nome" value={formData.titolo || formData.sinossi_breve || ''} onChange={e => setFormData({...formData, titolo: e.target.value, sinossi_breve: e.target.value})} />
                            {editMode === 'quest' && (
                                <input type="time" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formData.orario_indicativo || ''} onChange={e => setFormData({...formData, orario_indicativo: e.target.value})} />
                            )}
                            <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-32" placeholder="Sinossi / Descrizione" value={formData.sinossi || formData.descrizione_ampia || ''} onChange={e => setFormData({...formData, sinossi: e.target.value, descrizione_ampia: e.target.value})} />
                            {editMode === 'quest' && (
                                <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-20" placeholder="Props (Materiale)" value={formData.props || ''} onChange={e => setFormData({...formData, props: e.target.value})} />
                            )}
                            <button onClick={handleSaveMain} className="w-full bg-indigo-600 py-4 rounded-xl font-black uppercase tracking-widest"><Save className="inline mr-2" /> Salva Modifiche</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Area Contenuto */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedEvento && (
                    <div className="bg-indigo-900/10 border-b border-gray-800 p-4">
                        <div className="flex justify-between">
                            <h1 className="text-2xl font-black uppercase">{selectedEvento.titolo}</h1>
                            {isMaster && <button onClick={() => handleDeleteMain('evento', selectedEvento.id)} className="text-red-900 hover:text-red-500"><Trash2/></button>}
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold text-gray-400 mt-1 uppercase">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {selectedEvento.luogo}</span>
                            <span className="text-indigo-400 flex items-center gap-1"><Info size={12}/> {selectedEvento.pc_guadagnati} PC</span>
                        </div>
                        <p className="text-gray-400 text-xs italic mt-2 leading-relaxed">{selectedEvento.sinossi}</p>
                        {isMaster && (
                            <button onClick={() => startEdit('giorno')} className="mt-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-black">+ AGGIUNGI GIORNO</button>
                        )}
                    </div>
                )}

                <div className="p-4 space-y-16">
                    {selectedEvento?.giorni.map((giorno, gIdx) => (
                        <GiornoSection key={giorno.id} giorno={giorno} gIdx={gIdx} isMaster={isMaster} risorse={risorse}
                            onEdit={startEdit} onDelete={handleDeleteMain} 
                            onAddQuest={(gid) => startEdit('quest', { giorno_evento: gid })}
                            questHandlers={questHandlers} />
                    ))}
                </div>
            </div>

            {/* Modal Scanner QR */}
            {scanningForVista && (
                <div className="fixed inset-0 z-100 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-900">
                        <span className="font-black text-white uppercase italic">Associa QR Fisico</span>
                        <button onClick={() => setScanningForVista(null)} className="px-4 py-1.5 bg-red-600 rounded-lg text-xs font-black">X ANNULLA</button>
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