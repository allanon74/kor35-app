import React, { useState, useEffect } from 'react';
import { 
    getEventi, updateMostroHp, associaQrAVista, getRisorseEditor,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest,
    addPngToQuest, removePngFromQuest,
    addMostroToQuest, removeMostroFromQuest,
    addVistaToQuest, removeVistaFromQuest,
    fetchAuthenticated // Usato per salvataggio generico statistiche e note
} from '../api';
import { useCharacter } from './CharacterContext';
import { 
    Plus, Edit2, Trash2, Save, X, 
    Calendar, MapPin, Users, Swords, QrCode as QrIcon,
    Info, Heart, Shield, Trash, UserCheck, Layout, Zap, ChevronDown, ChevronUp
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

    // Stato per gestire quali mostri mostrano i dettagli (costume/note)
    const [expandedMostri, setExpandedMostri] = useState({});

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

    // --- HANDLERS ---

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
                if (!payload.template || !payload.staffer) return alert("Seleziona Mostro e Staffer");
                await addMostroToQuest(
                    parseInt(payload.quest), 
                    parseInt(payload.template), 
                    parseInt(payload.staffer), 
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
        } catch (e) { console.error(e); alert("Errore nell'aggiunta."); }
    };

    const handleUpdateMostroStat = async (id, field, delta) => {
        try {
            // Utilizziamo un endpoint generico o PATCH se il backend lo supporta
            // Qui assumiamo che updateMostroHp possa essere esteso o usiamo fetchAuthenticated direttamente
            const mostro = selectedEvento.giorni.flatMap(g => g.quests).flatMap(q => q.mostri_presenti).find(m => m.id === id);
            const newValue = mostro[field] + delta;
            
            await fetchAuthenticated(`/plot/api/mostri-istanza/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ [field]: newValue })
            }, onLogout);
            refreshData();
        } catch (e) { console.error(e); }
    };

    const handleSaveMostroNotes = async (id, note) => {
        try {
            await fetchAuthenticated(`/plot/api/mostri-istanza/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ note_per_staffer: note })
            }, onLogout);
            alert("Note salvate");
            refreshData();
        } catch (e) { console.error(e); }
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

    const toggleExpandMostro = (id) => {
        setExpandedMostri(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- RENDERERS ---

    const renderEventHeaderInfo = () => {
        if (!selectedEvento) return null;
        return (
            <div className="bg-indigo-900/10 border-b border-gray-800 p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase text-white">{selectedEvento.titolo}</h1>
                        <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {selectedEvento.luogo}</span>
                            <span className="flex items-center gap-1"><Info size={12}/> {selectedEvento.pc_guadagnati} PC</span>
                        </div>
                    </div>
                    {isMaster && (
                        <div className="flex gap-2">
                            <button onClick={() => setEditMode('giorno')} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-[10px] font-bold">+ GIORNO</button>
                        </div>
                    )}
                </div>
                <p className="text-gray-400 text-xs italic">{selectedEvento.sinossi}</p>
            </div>
        );
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-20 overflow-hidden">
            {/* Top Bar Selezione */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex gap-2 z-40 shadow-xl">
                <select 
                    className="flex-1 bg-gray-900 p-3 rounded-xl border border-gray-800 font-black text-indigo-400 outline-none appearance-none cursor-pointer"
                    value={selectedEvento?.id || ''}
                    onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}
                >
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo.toUpperCase()}</option>)}
                </select>
                {isMaster && <button onClick={() => setEditMode('evento')} className="p-3 bg-indigo-600 rounded-xl"><Plus size={24}/></button>}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderEventHeaderInfo()}

                <div className="p-4 space-y-10">
                    {selectedEvento?.giorni.map((giorno, gIdx) => (
                        <div key={giorno.id} className="space-y-4">
                            <div className="flex justify-between items-end border-b border-emerald-500/20 pb-2">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Giorno {gIdx + 1}</span>
                                    <h2 className="text-lg font-black italic text-white uppercase">{giorno.sinossi_breve}</h2>
                                </div>
                                {isMaster && (
                                    <button onClick={() => setEditMode('quest')} className="bg-emerald-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">+ Quest</button>
                                )}
                            </div>

                            <div className="grid gap-6">
                                {giorno.quests.map(quest => (
                                    <div key={quest.id} className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl border-l-4 border-l-indigo-500/30">
                                        {/* Quest Header */}
                                        <div className="bg-gray-800/80 px-4 py-2.5 flex justify-between items-center border-b border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-600 text-white px-2 py-0.5 rounded font-black text-[10px]">{quest.orario_indicativo?.slice(0,5)}</div>
                                                <h3 className="font-black text-sm text-white uppercase tracking-tight">{quest.titolo}</h3>
                                            </div>
                                            {isMaster && <button onClick={() => handleRemoveSubItem('quest', quest.id)} className="text-red-900 hover:text-red-500"><Trash size={14}/></button>}
                                        </div>

                                        <div className="p-4 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* PnG Block */}
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1"><Users size={12}/> PnG Necessari</span>
                                                    <div className="bg-gray-900/50 rounded-xl p-2 space-y-1">
                                                        {quest.png_richiesti.map(p => (
                                                            <div key={p.id} className="flex justify-between items-center p-2 bg-gray-950 border border-gray-800 rounded-lg text-[11px]">
                                                                <span className="font-bold">{p.personaggio_details?.nome}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-indigo-400 italic font-bold flex items-center gap-1"><UserCheck size={10}/> {p.staffer_details?.username || '---'}</span>
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
                                                                <button onClick={() => handleAddSubItem('png', { quest: quest.id, personaggio: document.getElementById(`p-${quest.id}`).value })} className="bg-indigo-600 p-1.5 rounded"><Plus size={14}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mostri Block - COMPLETO DI PV/PA/PS E DETTAGLI NASCOSTI */}
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><Swords size={12}/> Combat Table</span>
                                                    <div className="bg-gray-900/50 rounded-xl p-2 space-y-2">
                                                        {quest.mostri_presenti.map(m => (
                                                            <div key={m.id} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 shadow-sm">
                                                                {/* Riga Superiore: Nome e Staffer */}
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex-1">
                                                                        <div className="text-[11px] font-black uppercase text-red-400 leading-tight">{m.template_details?.nome}</div>
                                                                        <div className="text-[10px] text-indigo-400 font-bold italic flex items-center gap-1">
                                                                            <UserCheck size={10}/> {m.staffer_details?.username || 'DA ASSEGNARE'}
                                                                        </div>
                                                                    </div>
                                                                    {isMaster && <button onClick={() => handleRemoveSubItem('mostro', m.id)} className="text-red-900 hover:text-red-500 ml-2"><Trash size={12}/></button>}
                                                                </div>

                                                                {/* Riga Centrale: Contatori PV, PA, PS */}
                                                                <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-lg border border-gray-800/50">
                                                                    {/* Contatore PV */}
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 rounded border border-red-900/30">
                                                                            <Heart size={10} className="text-red-500 fill-red-500"/>
                                                                            <span className="text-xs font-black w-4 text-center">{m.punti_vita}</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'punti_vita', 1)} className="w-4 h-4 bg-emerald-900/40 text-emerald-500 rounded text-[9px] font-black">+</button>
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'punti_vita', -1)} className="w-4 h-4 bg-red-900/40 text-red-500 rounded text-[9px] font-black">-</button>
                                                                        </div>
                                                                    </div>
                                                                    {/* Contatore PA (Armatura) */}
                                                                    <div className="flex items-center gap-1.5 border-l border-gray-800 pl-2">
                                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 rounded border border-gray-700">
                                                                            <Shield size={10} className="text-gray-400"/>
                                                                            <span className="text-xs font-black w-4 text-center">{m.armatura}</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'armatura', 1)} className="w-4 h-4 bg-gray-800 text-white rounded text-[9px] font-black">+</button>
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'armatura', -1)} className="w-4 h-4 bg-gray-800 text-white rounded text-[9px] font-black">-</button>
                                                                        </div>
                                                                    </div>
                                                                    {/* Contatore PS (Guscio) */}
                                                                    <div className="flex items-center gap-1.5 border-l border-gray-800 pl-2">
                                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 rounded border border-indigo-900/30">
                                                                            <Layout size={10} className="text-indigo-400"/>
                                                                            <span className="text-xs font-black w-4 text-center">{m.guscio}</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'guscio', 1)} className="w-4 h-4 bg-indigo-900/40 text-indigo-400 rounded text-[9px] font-black">+</button>
                                                                            <button onClick={() => handleUpdateMostroStat(m.id, 'guscio', -1)} className="w-4 h-4 bg-indigo-900/40 text-indigo-400 rounded text-[9px] font-black">-</button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Attacchi Rapidi */}
                                                                <div className="mt-2 space-y-1">
                                                                    {m.template_details?.attacchi?.map((att, idx) => (
                                                                        <div key={idx} className="text-[9px] text-amber-500 font-mono bg-amber-900/10 px-1.5 py-0.5 rounded border border-amber-900/20">
                                                                            <span className="font-black">{att.nome_attacco}:</span> {att.descrizione_danno}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Pulsante Toggle Dettagli (Costume e Note) */}
                                                                <button 
                                                                    onClick={() => toggleExpandMostro(m.id)}
                                                                    className="w-full mt-2 flex items-center justify-center gap-1 text-[8px] font-black uppercase text-gray-500 hover:text-indigo-400 transition-colors py-1 border-t border-gray-800/50"
                                                                >
                                                                    {expandedMostri[m.id] ? <><ChevronUp size={10}/> Nascondi Info Staff</> : <><ChevronDown size={10}/> Mostra Costume e Note</>}
                                                                </button>

                                                                {/* Sezione Espandibile */}
                                                                {expandedMostri[m.id] && (
                                                                    <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                        {/* Costume (Sola Lettura dal Template) */}
                                                                        <div className="p-2 bg-indigo-950/20 border border-indigo-500/20 rounded">
                                                                            <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Costume / Tratti:</span>
                                                                            <p className="text-[10px] text-indigo-200 italic leading-tight">
                                                                                {m.template_details?.costume || "Nessun dettaglio costume definito."}
                                                                            </p>
                                                                        </div>

                                                                        {/* Note per Staffer (Editabili) */}
                                                                        <div className="space-y-1">
                                                                            <span className="text-[8px] font-black text-emerald-500 uppercase block">Note per lo Staffer:</span>
                                                                            <textarea 
                                                                                id={`note-${m.id}`}
                                                                                defaultValue={m.note_per_staffer}
                                                                                placeholder="Inserisci istruzioni specifiche per chi interpreta..."
                                                                                className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-emerald-500 h-16 resize-none"
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleSaveMostroNotes(m.id, document.getElementById(`note-${m.id}`).value)}
                                                                                className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-1 rounded text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-colors"
                                                                            >
                                                                                Salva Note Staff
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        
                                                        {/* Form Aggiunta Mostro */}
                                                        {isMaster && (
                                                            <div className="flex flex-col gap-1 pt-2 border-t border-gray-800">
                                                                <div className="flex gap-1">
                                                                    <select id={`m-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none">
                                                                        <option value="">Mostro...</option>
                                                                        {risorse.templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                                                    </select>
                                                                    <select id={`ms-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-indigo-500/30">
                                                                        <option value="">Staffer...</option>
                                                                        {risorse.staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                                                    </select>
                                                                    <button onClick={() => {
                                                                        const t = document.getElementById(`m-${quest.id}`).value;
                                                                        const s = document.getElementById(`ms-${quest.id}`).value;
                                                                        handleAddSubItem('mostro', { quest: quest.id, template: t, staffer: s });
                                                                    }} className="bg-red-600 p-1.5 rounded hover:bg-red-500"><Plus size={14}/></button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* QR Section - FIX NOMI MANIFESTI/INVENTARI */}
                                            <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-2">
                                                {quest.viste_previste.map(v => (
                                                    <div key={v.id} className="flex items-center gap-2 bg-black/40 border border-gray-800 p-1.5 rounded-xl group pr-3 shadow-sm">
                                                        <div className={`p-1.5 rounded-lg ${v.qr_code ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                                                            <QrIcon size={14} className={v.qr_code ? 'text-emerald-500' : 'text-gray-600'} />
                                                        </div>
                                                        <div className="max-w-[120px] overflow-hidden">
                                                            <span className="text-[10px] font-bold text-gray-200 truncate block">
                                                                {v.manifesto_details?.nome || v.manifesto_details?.titolo || v.inventario_details?.nome || 'OGGETTO'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setScanningForVista(v.id)} className="text-indigo-400"><QrIcon size={12}/></button>
                                                            {isMaster && <button onClick={() => handleRemoveSubItem('vista', v.id)} className="text-red-900"><X size={12}/></button>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isMaster && (
                                                    <div className="flex items-center gap-1 bg-emerald-500/5 border border-dashed border-emerald-500/20 p-1.5 rounded-xl">
                                                        <select className="bg-transparent text-[9px] font-bold text-emerald-500 outline-none" value={newVistaData.tipo} onChange={(e) => setNewVistaData({...newVistaData, tipo: e.target.value, contentId: ''})}>
                                                            <option value="MAN">MAN</option>
                                                            <option value="INV">INV</option>
                                                        </select>
                                                        <select className="bg-transparent text-[9px] text-gray-400 outline-none max-w-[100px]" value={newVistaData.contentId} onChange={(e) => setNewVistaData({...newVistaData, contentId: e.target.value})}>
                                                            <option value="">...</option>
                                                            {newVistaData.tipo === 'INV' ? risorse.inventari.map(i => <option key={i.id} value={i.id}>{i.nome}</option>) : risorse.manifesti.map(m => <option key={m.id} value={m.id}>{m.nome || m.titolo}</option>)}
                                                        </select>
                                                        <button onClick={() => { handleAddSubItem('vista', { quest: quest.id, ...newVistaData }); setNewVistaData({...newVistaData, contentId: ''}); }} className="text-emerald-500"><Plus size={14}/></button>
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

            {/* Modal Scanner QR */}
            {scanningForVista && (
                <div className="fixed inset-0 z-100 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800">
                        <span className="font-black text-white uppercase italic">Associa QR Fisico</span>
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