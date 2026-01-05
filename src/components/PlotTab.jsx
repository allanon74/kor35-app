import React, { useState, useEffect } from 'react';
import { 
    getEventi, updateMostroHp, associaQrAVista, getRisorseEditor,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest,
    addPngToQuest, removePngFromQuest,
    addMostroToQuest, removeMostroFromQuest,
    addVistaToQuest, removeVistaFromQuest
} from '../api';
import { useCharacter } from './CharacterContext';
import { 
    Plus, Edit2, Trash2, Save, X, Clock, 
    Calendar, MapPin, Users, Swords, Eye, QrCode as QrIcon,
    Info, Heart, Shield, ChevronDown, Trash, UserCheck, Layout
} from 'lucide-react';
import QrTab from './QrTab';

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [risorse, setRisorse] = useState({ png: [], templates: [], manifesti: [], inventari: [], staff: [] });
    const [editMode, setEditMode] = useState(null); 
    const [formData, setFormData] = useState({});
    const [newVistaData, setNewVistaData] = useState({ tipo: 'MAN', contentId: '' });
    const [scanningForVista, setScanningForVista] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [evData, risData] = await Promise.all([
                getEventi(onLogout),
                getRisorseEditor(onLogout)
            ]);
            setEventi(evData);
            setRisorse(risData);
            if (evData.length > 0) setSelectedEvento(evData[0]);
        } catch (e) {
            console.error("Errore caricamento plot:", e);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        const data = await getEventi(onLogout);
        setEventi(data);
        if (selectedEvento) {
            const updated = data.find(e => e.id === selectedEvento.id);
            setSelectedEvento(updated || (data.length > 0 ? data[0] : null));
        }
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
        } catch (e) { alert("Errore durante il salvataggio."); }
    };

    const handleDeleteMain = async (tipo, id) => {
        if (!window.confirm(`Eliminare definitivamente questo ${tipo}?`)) return;
        try {
            if (tipo === 'evento') {
                await deleteEvento(id, onLogout);
                setSelectedEvento(null);
            }
            if (tipo === 'giorno') await deleteGiorno(id, onLogout);
            if (tipo === 'quest') await deleteQuest(id, onLogout);
            refreshData();
        } catch (e) { alert("Errore eliminazione."); }
    };

    const handleAddSubItem = async (tipo, payload) => {
        try {
            if (tipo === 'png') {
                const pId = parseInt(payload.personaggio);
                if (!pId) return alert("Seleziona un PnG");
                const selectedPng = risorse.png.find(p => p.id === pId);
                const stafferId = selectedPng ? selectedPng.proprietario : null;
                await addPngToQuest(parseInt(payload.quest), pId, stafferId, onLogout);
            }
            if (tipo === 'mostro') {
                const tId = parseInt(payload.template);
                if (!tId) return alert("Seleziona un template mostro");
                // I mostri richiedono un'assegnazione staff manuale (perché sono generici)
                await addMostroToQuest(
                    parseInt(payload.quest), 
                    tId, 
                    payload.staffer ? parseInt(payload.staffer) : null, 
                    onLogout
                );
            }
            if (tipo === 'vista') {
                const cId = parseInt(payload.contentId);
                if (!cId) return alert("Seleziona un contenuto");
                const vistaPayload = {
                    quest: parseInt(payload.quest),
                    tipo: payload.tipo,
                    manifesto: payload.tipo === 'MAN' ? cId : null,
                    inventario: payload.tipo === 'INV' ? cId : null
                };
                await addVistaToQuest(payload.quest, vistaPayload, onLogout);
            }
            refreshData();
        } catch (e) { 
            console.error(e);
            alert("Errore nell'aggiunta."); 
        }
    };

    const handleRemoveSubItem = async (tipo, id) => {
        if (!window.confirm("Rimuovere questo elemento?")) return;
        try {
            if (tipo === 'png') await removePngFromQuest(id, onLogout);
            if (tipo === 'mostro') await removeMostroFromQuest(id, onLogout);
            if (tipo === 'vista') await removeVistaFromQuest(id, onLogout);
            refreshData();
        } catch (e) { alert("Errore durante la rimozione."); }
    };

    const handleHpChange = async (id, delta) => {
        try {
            await updateMostroHp(id, delta, onLogout);
            refreshData();
        } catch (e) { console.error(e); }
    };

    const startEdit = (tipo, oggetto = {}) => {
        setEditMode(tipo);
        setFormData(oggetto);
    };

    const renderEditor = () => {
        if (!editMode) return null;
        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 md:p-10 overflow-y-auto">
                <div className="bg-gray-800 border-t-4 border-indigo-500 rounded-xl p-6 w-full max-w-2xl mx-auto space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-indigo-400 uppercase italic">Editor {editMode}</h3>
                        <button onClick={() => setEditMode(null)} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"><X /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Titolo / Identificativo</label>
                            <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 outline-none focus:border-indigo-500"
                                value={formData.titolo || formData.nome || ''}
                                onChange={e => setFormData({...formData, titolo: e.target.value, nome: e.target.value})} />
                        </div>
                        {editMode === 'evento' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Inizio</label>
                                    <input type="datetime-local" className="w-full bg-gray-900 p-2 rounded border border-gray-700" 
                                        value={formData.data_inizio?.slice(0,16) || ''} 
                                        onChange={e => setFormData({...formData, data_inizio: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">PC</label>
                                    <input type="number" className="w-full bg-gray-900 p-2 rounded border border-gray-700" 
                                        value={formData.pc_guadagnati || 0} 
                                        onChange={e => setFormData({...formData, pc_guadagnati: e.target.value})}/>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Luogo</label>
                                    <input className="w-full bg-gray-900 p-2 rounded border border-gray-700" 
                                        value={formData.luogo || ''} 
                                        onChange={e => setFormData({...formData, luogo: e.target.value})}/>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block">Sinossi / Descrizione</label>
                            <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-32 text-sm"
                                value={formData.sinossi || formData.sinossi_breve || formData.descrizione_ampia || ''}
                                onChange={e => setFormData({...formData, sinossi: e.target.value, sinossi_breve: e.target.value, descrizione_ampia: e.target.value})} />
                        </div>
                        {editMode === 'quest' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Orario</label>
                                    <input type="time" className="w-full bg-gray-900 p-2 rounded border border-gray-700" 
                                        value={formData.orario_indicativo || ''} 
                                        onChange={e => setFormData({...formData, orario_indicativo: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Props</label>
                                    <input className="w-full bg-gray-900 p-2 rounded border border-gray-700" 
                                        value={formData.props || ''} 
                                        onChange={e => setFormData({...formData, props: e.target.value})}/>
                                </div>
                            </div>
                        )}
                        <button onClick={handleSaveMain} className="w-full bg-indigo-600 py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-colors">
                            <Save className="inline mr-2" /> Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEventHeaderInfo = () => {
        if (!selectedEvento) return null;
        return (
            <div className="bg-indigo-900/10 border-b border-gray-800 p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black uppercase text-white tracking-tighter">{selectedEvento.titolo}</h1>
                            {isMaster && <button onClick={() => startEdit('evento', selectedEvento)} className="p-1 text-indigo-400 hover:text-white transition-colors"><Edit2 size={18}/></button>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-gray-400 italic">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {selectedEvento.luogo || 'Luogo non definito'}</span>
                            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(selectedEvento.data_inizio).toLocaleDateString()}</span>
                            <span className="text-indigo-400 flex items-center gap-1"><Info size={12}/> {selectedEvento.pc_guadagnati} PC</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isMaster && (
                            <>
                                <button onClick={() => startEdit('giorno', { evento: selectedEvento.id })} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase italic tracking-widest">+ Giorno</button>
                                <button onClick={() => handleDeleteMain('evento', selectedEvento.id)} className="p-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded-lg"><Trash2 size={18}/></button>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-gray-300 text-sm italic">{selectedEvento.sinossi}</p>
            </div>
        );
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-20 overflow-hidden">
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex gap-2 z-40">
                <select 
                    className="flex-1 bg-gray-900 p-3 rounded-xl border border-gray-800 font-black text-indigo-400 outline-none appearance-none"
                    value={selectedEvento?.id || ''}
                    onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}
                >
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo.toUpperCase()}</option>)}
                </select>
                {isMaster && <button onClick={() => startEdit('evento')} className="p-3 bg-indigo-600 rounded-xl"><Plus size={24}/></button>}
            </div>

            {renderEditor()}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderEventHeaderInfo()}

                <div className="p-4 space-y-12">
                    {selectedEvento?.giorni.map((giorno, gIdx) => (
                        <div key={giorno.id} className="space-y-6">
                            <div className="flex justify-between items-end border-b border-emerald-500/20 pb-2">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Giorno {gIdx + 1}</span>
                                    <h2 className="text-xl font-black italic text-white uppercase">{giorno.sinossi_breve}</h2>
                                </div>
                                {isMaster && (
                                    <div className="flex gap-3">
                                        <button onClick={() => startEdit('giorno', giorno)} className="text-gray-500"><Edit2 size={16}/></button>
                                        <button onClick={() => startEdit('quest', { giorno: giorno.id })} className="bg-emerald-600 px-3 py-1 rounded text-[10px] font-bold uppercase">+ Quest</button>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-6">
                                {giorno.quests.map(quest => (
                                    <div key={quest.id} className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="bg-gray-800/80 px-4 py-3 flex justify-between items-center border-b border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg font-black text-xs">{quest.orario_indicativo?.slice(0,5)}</div>
                                                <h3 className="font-black text-white uppercase tracking-tight">{quest.titolo}</h3>
                                            </div>
                                            {isMaster && <button onClick={() => startEdit('quest', quest)} className="text-gray-500"><Edit2 size={16}/></button>}
                                        </div>

                                        <div className="p-5 space-y-5">
                                            <p className="text-sm text-gray-400 italic">{quest.descrizione_ampia}</p>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* PnG Block */}
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1"><Users size={12}/> PnG Necessari</span>
                                                    <div className="bg-gray-900/50 rounded-xl p-2 space-y-1">
                                                        {quest.png_richiesti.map(p => (
                                                            <div key={p.id} className="flex justify-between items-center p-2 bg-gray-950 border border-gray-800 rounded-lg text-[11px] group">
                                                                <span className="font-bold">{p.personaggio_details?.nome || '???'}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-indigo-400 italic"><UserCheck size={10}/> {p.staffer_details?.username || '---'}</span>
                                                                    {isMaster && <button onClick={() => handleRemoveSubItem('png', p.id)} className="text-red-500"><X size={12}/></button>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {isMaster && (
                                                            <div className="flex gap-1 pt-2">
                                                                <select id={`p-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none">
                                                                    <option value="">Scegli PnG...</option>
                                                                    {risorse.png.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                                                                </select>
                                                                <button onClick={() => handleAddSubItem('png', { 
                                                                    quest: quest.id, 
                                                                    personaggio: document.getElementById(`p-${quest.id}`).value
                                                                })} className="bg-indigo-600 p-1.5 rounded"><Plus size={14}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mostri Block */}
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><Swords size={12}/> Combat Table</span>
                                                    <div className="bg-gray-900/50 rounded-xl p-2 space-y-1">
                                                        {quest.mostri_presenti.map(m => (
                                                            <div key={m.id} className="bg-gray-950 p-2 rounded-lg border border-gray-800 flex justify-between items-center group">
                                                                <div className="flex flex-col">
                                                                    <div className="text-[11px] font-black uppercase text-red-400">
                                                                        {m.template_details?.nome || '???'}
                                                                    </div>
                                                                    {m.staffer_details && <span className="text-[8px] text-gray-500 italic">Interprete: {m.staffer_details.username}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isMaster && <button onClick={() => handleRemoveSubItem('mostro', m.id)} className="text-red-900 mr-1"><Trash size={12}/></button>}
                                                                    <div className="flex items-center gap-1 px-2 bg-gray-900 rounded border border-gray-800">
                                                                        <Heart size={10} className="text-red-500 fill-red-500"/>
                                                                        <span className="text-sm font-black w-4 text-center">{m.punti_vita}</span>
                                                                    </div>
                                                                    <button onClick={() => handleHpChange(m.id, -1)} className="w-6 h-6 bg-red-900/40 text-red-500 rounded-full font-black">-</button>
                                                                    <button onClick={() => handleHpChange(m.id, 1)} className="w-6 h-6 bg-emerald-900/40 text-emerald-500 rounded-full font-black">+</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {isMaster && (
                                                            <div className="flex flex-col gap-1 pt-2">
                                                                <div className="flex gap-1">
                                                                    <select id={`m-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none">
                                                                        <option value="">Evoca Mostro...</option>
                                                                        {risorse.templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                                                    </select>
                                                                    {/* Selezione Staffer per Mostri */}
                                                                    <select id={`ms-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none">
                                                                        <option value="">Staffer...</option>
                                                                        {risorse.staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                                                    </select>
                                                                    <button onClick={() => handleAddSubItem('mostro', { 
                                                                        quest: quest.id, 
                                                                        template: document.getElementById(`m-${quest.id}`).value,
                                                                        staffer: document.getElementById(`ms-${quest.id}`).value
                                                                    })} className="bg-red-600 p-1.5 rounded"><Plus size={14}/></button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* QR Section */}
                                            <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-3">
                                                {quest.viste_previste.map(v => (
                                                    <div key={v.id} className="flex items-center gap-3 bg-black/40 border border-gray-800 p-2 rounded-xl group relative">
                                                        <QrIcon size={16} className={v.qr_code ? 'text-emerald-500' : 'text-gray-600'} />
                                                        <div>
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase block leading-none mb-1">{v.tipo}</span>
                                                            <span className="text-[11px] font-bold text-gray-200">
                                                                {v.manifesto_details?.nome || v.inventario_details?.nome || 'OGGETTO'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setScanningForVista(v.id)} className="p-1.5 text-indigo-400 hover:text-white" title="Associa QR"><QrIcon size={14}/></button>
                                                            {isMaster && <button onClick={() => handleRemoveSubItem('vista', v.id)} className="p-1.5 text-red-900 hover:text-red-500"><X size={14}/></button>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isMaster && (
                                                    <div className="flex items-center gap-2 bg-emerald-500/5 border border-dashed border-emerald-500/20 p-2 rounded-xl">
                                                        <select className="bg-transparent text-[10px] font-bold text-emerald-500 outline-none" value={newVistaData.tipo} onChange={(e) => setNewVistaData({...newVistaData, tipo: e.target.value, contentId: ''})}>
                                                            <option value="MAN">MAN</option>
                                                            <option value="INV">INV</option>
                                                        </select>
                                                        <select className="bg-transparent text-[10px] text-gray-400 outline-none max-w-[120px]" value={newVistaData.contentId} onChange={(e) => setNewVistaData({...newVistaData, contentId: e.target.value})}>
                                                            <option value="">Seleziona...</option>
                                                            {newVistaData.tipo === 'INV' ? risorse.inventari.map(i => <option key={i.id} value={i.id}>{i.nome}</option>) : risorse.manifesti.map(m => <option key={m.id} value={m.id}>{m.nome || m.titolo}</option>)}
                                                        </select>
                                                        <button onClick={() => { handleAddSubItem('vista', { quest: quest.id, ...newVistaData }); setNewVistaData({...newVistaData, contentId: ''}); }} className="text-emerald-500 hover:text-emerald-400"><Plus size={16}/></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {scanningForVista && (
                <div className="fixed inset-0 z-100 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <QrIcon className="text-emerald-400" />
                            <span className="font-black text-white uppercase italic tracking-tighter">Associa QR Fisico</span>
                        </div>
                        <button onClick={() => setScanningForVista(null)} className="px-4 py-1 bg-red-600 rounded-lg text-xs font-black">X ANNULLA</button>
                    </div>
                    <div className="flex-1">
                        <QrTab onScanSuccess={async (qr_id) => {
                            try {
                                await associaQrAVista(scanningForVista, qr_id, onLogout);
                                setScanningForVista(null);
                                refreshData();
                            } catch (e) { alert("Errore associazione QR."); }
                        }} onLogout={onLogout} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlotTab;