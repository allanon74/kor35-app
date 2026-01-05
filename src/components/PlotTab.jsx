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
    Calendar, MapPin, Users, Swords, Eye, QrCode,
    Info, Heart, Shield, ChevronDown, Trash
} from 'lucide-react';
import QrTab from './QrTab';

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Liste per i menu a tendina (caricate solo per i Master)
    const [risorse, setRisorse] = useState({ png: [], templates: [], manifesti: [], inventari: [], staff: [] });

    // Stati per l'editing
    const [editMode, setEditMode] = useState(null); // 'evento', 'giorno', 'quest'
    const [formData, setFormData] = useState({});
    
    // Stato per associazione QR
    const [scanningForVista, setScanningForVista] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [evData, risData] = await Promise.all([
                getEventi(onLogout),
                isMaster ? getRisorseEditor(onLogout) : Promise.resolve(null)
            ]);
            setEventi(evData);
            if (risData) setRisorse(risData);
            if (evData.length > 0) setSelectedEvento(evData[0]);
        } catch (e) {
            console.error("Errore caricamento dati:", e);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        const data = await getEventi(onLogout);
        setEventi(data);
        if (selectedEvento) {
            const updated = data.find(e => e.id === selectedEvento.id);
            setSelectedEvento(updated);
            // Se stiamo editando una quest, aggiorniamo i dati nel form per vedere i nuovi PnG/Mostri
            if (editMode === 'quest' && formData.id) {
                for (const g of updated.giorni) {
                    const q = g.quests.find(quest => quest.id === formData.id);
                    if (q) setFormData(q);
                }
            }
        }
    };

    // --- AZIONI CRUD PRINCIPALI ---
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
                if (formData.id) await updateQuest(formData.id, formData, onLogout);
                else await createQuest(formData, onLogout);
            }
            setEditMode(null);
            refreshData();
        } catch (e) {
            alert("Errore nel salvataggio.");
        }
    };

    // --- LOGICA ELEMENTI INTERNI ALLA QUEST ---
    const handleAddSubItem = async (tipo, subData) => {
        try {
            if (tipo === 'png') await addPngToQuest({ ...subData, quest: formData.id }, onLogout);
            if (tipo === 'mostro') await addMostroToQuest({ ...subData, quest: formData.id }, onLogout);
            if (tipo === 'vista') await addVistaToQuest({ ...subData, quest: formData.id }, onLogout);
            refreshData();
        } catch (e) { alert("Errore durante l'aggiunta."); }
    };

    const handleRemoveSubItem = async (tipo, id) => {
        try {
            if (tipo === 'png') await removePngFromQuest(id, onLogout);
            if (tipo === 'mostro') await removeMostroFromQuest(id, onLogout);
            if (tipo === 'vista') await removeVistaFromQuest(id, onLogout);
            refreshData();
        } catch (e) { alert("Errore durante la rimozione."); }
    };

    // --- RENDER FORM DI EDITING ---
    const renderEditor = () => {
        if (!editMode) return null;
        return (
            <div className="p-4 bg-gray-800 border-b-2 border-indigo-500 space-y-4 overflow-y-auto max-h-[85vh] z-20 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-indigo-400 uppercase">Editor {editMode}</h3>
                    <button onClick={() => setEditMode(null)}><X /></button>
                </div>
                
                <div className="space-y-4">
                    <input className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700"
                        placeholder="Titolo / Nome"
                        value={formData.titolo || formData.nome || ''}
                        onChange={e => setFormData({...formData, titolo: e.target.value, nome: e.target.value})} />

                    {editMode === 'evento' && (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="datetime-local" className="bg-gray-900 p-2 rounded text-xs" value={formData.data_inizio?.slice(0,16)} onChange={e => setFormData({...formData, data_inizio: e.target.value})}/>
                            <input type="number" className="bg-gray-900 p-2 rounded text-xs" placeholder="PC" value={formData.pc_guadagnati} onChange={e => setFormData({...formData, pc_guadagnati: e.target.value})}/>
                        </div>
                    )}

                    <textarea className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700 h-24 text-sm"
                        placeholder="Descrizione / Sinossi"
                        value={formData.sinossi || formData.sinossi_breve || formData.descrizione_ampia || ''}
                        onChange={e => setFormData({...formData, sinossi: e.target.value, sinossi_breve: e.target.value, descrizione_ampia: e.target.value})} />

                    {editMode === 'quest' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" className="bg-gray-900 p-2 rounded" value={formData.orario_indicativo} onChange={e => setFormData({...formData, orario_indicativo: e.target.value})}/>
                                <input className="bg-gray-900 p-2 rounded text-xs" placeholder="Props (Oggetti di scena)" value={formData.props || ''} onChange={e => setFormData({...formData, props: e.target.value})}/>
                            </div>

                            {/* AGGIUNTA PNG, MOSTRI E VISTE (Solo se la quest esiste già) */}
                            {formData.id ? (
                                <div className="space-y-6 border-t border-gray-700 pt-4">
                                    {/* PnG */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase">Aggiungi PnG</h4>
                                        <div className="flex gap-1">
                                            <select id="sel-png" className="flex-1 bg-gray-900 p-2 rounded text-xs">
                                                <option value="">Seleziona PnG...</option>
                                                {risorse.png.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                            </select>
                                            <select id="sel-staff" className="flex-1 bg-gray-900 p-2 rounded text-xs">
                                                <option value="">Staff...</option>
                                                {risorse.staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                            </select>
                                            <button onClick={() => handleAddSubItem('png', { personaggio: document.getElementById('sel-png').value, staffer: document.getElementById('sel-staff').value })} className="bg-indigo-600 p-2 rounded"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                    {/* Mostri */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-red-400 uppercase">Evoca Mostro</h4>
                                        <div className="flex gap-1">
                                            <select id="sel-tpl" className="flex-1 bg-gray-900 p-2 rounded text-xs">
                                                <option value="">Tipo Mostro...</option>
                                                {risorse.templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                            </select>
                                            <button onClick={() => handleAddSubItem('mostro', { template: document.getElementById('sel-tpl').value })} className="bg-red-600 p-2 rounded"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                    {/* Viste */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase">Aggiungi Oggetto (QR)</h4>
                                        <div className="flex gap-1">
                                            <select id="sel-vis-tipo" className="bg-gray-900 p-2 rounded text-xs">
                                                <option value="MAN">Manifesto</option>
                                                <option value="INV">Inventario</option>
                                            </select>
                                            <select id="sel-vis-obj" className="flex-1 bg-gray-900 p-2 rounded text-xs">
                                                <option value="">Scegli Contenuto...</option>
                                                {risorse.manifesti.map(m => <option key={m.id} value={m.id}>{m.titolo}</option>)}
                                                {risorse.inventari.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                            </select>
                                            <button onClick={() => {
                                                const t = document.getElementById('sel-vis-tipo').value;
                                                const v = document.getElementById('sel-vis-obj').value;
                                                handleAddSubItem('vista', { tipo: t, manifesto: t==='MAN'?v:null, inventario: t==='INV'?v:null });
                                            }} className="bg-emerald-600 p-2 rounded"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ) : <p className="text-[10px] text-gray-500 italic">Salva la quest per poter aggiungere PnG e Mostri.</p>}
                        </>
                    )}

                    <button onClick={handleSaveMain} className="w-full bg-emerald-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Save size={20}/> SALVA TUTTO
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-mono animate-pulse">CARICAMENTO PLOT...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-24 overflow-hidden">
            {/* MODAL SCANNER QR SETUP */}
            {scanningForVista && (
                <div className="fixed inset-0 z-100 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
                        <span className="font-bold text-emerald-400">SETUP OGGETTO SCENA</span>
                        <button onClick={() => setScanningForVista(null)} className="text-red-400 font-bold">CHIUDI</button>
                    </div>
                    <QrTab onScanSuccess={handleQrAssocSuccess} onLogout={onLogout} />
                </div>
            )}

            {/* HEADER EVENTO */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 shadow-xl z-10 flex gap-2">
                <select 
                    className="flex-1 bg-gray-900 p-2.5 rounded-lg border border-gray-700 font-bold outline-none"
                    value={selectedEvento?.id || ''}
                    onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}
                >
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
                </select>
                {isMaster && (
                    <button onClick={() => startEdit('evento')} className="p-2.5 bg-emerald-600 rounded-lg"><Plus size={20}/></button>
                )}
            </div>

            {renderEditor()}

            {/* TIMELINE */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                {selectedEvento?.giorni.map(giorno => (
                    <div key={giorno.id} className="relative pl-6 border-l-2 border-emerald-500/20">
                        <div className="mb-4 flex justify-between items-start">
                            <h2 className="text-emerald-400 font-black text-lg uppercase italic">{giorno.sinossi_breve}</h2>
                            {isMaster && (
                                <button onClick={() => startEdit('quest', { giorno: giorno.id })} className="p-1.5 bg-emerald-900/30 text-emerald-400 rounded"><Plus size={14}/></button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {giorno.quests.map(quest => (
                                <div key={quest.id} className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg">
                                    <div className="bg-gray-800/80 p-3 border-b border-gray-700/50 flex justify-between items-center">
                                        <span className="text-indigo-300 font-bold text-sm uppercase">{quest.orario_indicativo.slice(0,5)} - {quest.titolo}</span>
                                        {isMaster && (
                                            <div className="flex gap-2">
                                                <button onClick={() => startEdit('quest', quest)} className="text-gray-400"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete('quest', quest.id)} className="text-red-900"><Trash size={16}/></button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <p className="text-xs text-gray-400 leading-relaxed">{quest.descrizione_ampia}</p>
                                        
                                        {quest.props && (
                                            <div className="p-2 bg-amber-900/10 border border-amber-900/30 rounded-lg text-[10px] text-amber-200/80 italic">
                                                <b className="text-amber-500 uppercase block">Materiale Scena:</b> {quest.props}
                                            </div>
                                        )}

                                        {/* Liste Operative */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* PnG */}
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-gray-500 uppercase">PnG Necessari</p>
                                                {quest.png_richiesti.map(p => (
                                                    <div key={p.id} className="flex justify-between items-center bg-gray-900 p-2 rounded-lg text-[11px] border border-gray-800">
                                                        <span>{p.personaggio_details.nome} ({p.staffer_details?.username || '-'})</span>
                                                        {isMaster && <button onClick={() => handleRemoveSubItem('png', p.id)} className="text-red-900"><X size={12}/></button>}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Mostri */}
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-gray-500 uppercase">Combat Table (HP)</p>
                                                {quest.mostri_presenti.map(m => (
                                                    <div key={m.id} className="bg-gray-900 p-2 rounded-lg border border-gray-800 flex justify-between items-center">
                                                        <div className="text-[11px]">
                                                            <b className="text-red-400 block uppercase">{m.template_details.nome}</b>
                                                            <span className="text-[9px] text-gray-500">ARM {m.armatura} | GUS {m.guscio}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={() => handleHpChange(m.id, -1)} className="w-6 h-6 bg-red-900/50 rounded-full text-xs">-</button>
                                                            <span className="font-bold text-sm w-4 text-center">{m.punti_vita}</span>
                                                            <button onClick={() => handleHpChange(m.id, 1)} className="w-6 h-6 bg-emerald-900/50 rounded-full text-xs">+</button>
                                                            {isMaster && <button onClick={() => handleRemoveSubItem('mostro', m.id)} className="ml-1 text-gray-700"><X size={12}/></button>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Viste QR */}
                                        <div className="space-y-2 pt-2 border-t border-gray-800">
                                            {quest.viste_previste.map(v => (
                                                <div key={v.id} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-gray-800">
                                                    <div className="text-[11px]">
                                                        <span className="text-emerald-500 font-bold text-[9px] block uppercase">{v.tipo}</span>
                                                        {v.manifesto_details?.titolo || v.inventario_details?.nome}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setScanningForVista(v.id)} className={`p-2 rounded-lg ${v.qr_code ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                                                            <QrCode size={14}/>
                                                        </button>
                                                        {isMaster && <button onClick={() => handleRemoveSubItem('vista', v.id)} className="text-red-900"><X size={14}/></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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