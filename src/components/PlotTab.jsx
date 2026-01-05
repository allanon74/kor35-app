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
    Calendar, MapPin, Users, Swords, Eye, QrCode,
    Info, Heart, Shield, ChevronRight
} from 'lucide-react';
import QrTab from './QrTab';

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Stati per l'editing
    const [editMode, setEditMode] = useState(null); // 'evento', 'giorno', 'quest'
    const [formData, setFormData] = useState({});
    
    // Stato per associazione QR
    const [scanningForVista, setScanningForVista] = useState(null);

    useEffect(() => {
        loadEventi();
    }, []);

    const loadEventi = async () => {
        try {
            const data = await getEventi(onLogout);
            setEventi(data);
            if (data.length > 0) {
                // Mantieni la selezione se possibile
                const current = selectedEvento ? data.find(e => e.id === selectedEvento.id) : data[0];
                setSelectedEvento(current || data[0]);
            }
        } catch (e) {
            console.error("Errore caricamento plot:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- AZIONI CRUD ---
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
                if (formData.id) await updateQuest(formData.id, formData, onLogout);
                else await createQuest(formData, onLogout);
            }
            setEditMode(null);
            loadEventi();
        } catch (e) {
            alert("Errore nel salvataggio. Verifica i dati inseriti.");
        }
    };

    const handleDelete = async (tipo, id) => {
        if (!window.confirm(`Vuoi eliminare definitivamente questo ${tipo}?`)) return;
        try {
            if (tipo === 'evento') await deleteEvento(id, onLogout);
            if (tipo === 'giorno') await deleteGiorno(id, onLogout);
            if (tipo === 'quest') await deleteQuest(id, onLogout);
            loadEventi();
        } catch (e) {
            alert("Errore nell'eliminazione.");
        }
    };

    // --- AZIONI OPERATIVE ---
    const handleHpChange = async (mostroId, delta) => {
        try {
            await updateMostroHp(mostroId, delta, onLogout);
            loadEventi(); // Refresh silenzioso per aggiornare i PV
        } catch (e) {
            console.error(e);
        }
    };

    const handleQrAssocSuccess = async (qrData) => {
        if (!scanningForVista) return;
        try {
            await associaQrAVista(scanningForVista, qrData.id, onLogout);
            alert("QR Code associato con successo all'oggetto.");
            setScanningForVista(null);
            loadEventi();
        } catch (e) {
            alert("Errore nell'associazione del QR.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-mono animate-pulse">CARICAMENTO PLOT...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-24 overflow-hidden">
            {/* MODAL SCANNER QR */}
            {scanningForVista && (
                <div className="fixed inset-0 z-100 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
                        <span className="font-bold text-emerald-400 flex items-center gap-2">
                            <QrCode size={20}/> SETUP OGGETTO SCENA
                        </span>
                        <button onClick={() => setScanningForVista(null)} className="p-2 bg-red-900/30 text-red-400 rounded-lg">CHIUDI</button>
                    </div>
                    <div className="flex-1 relative">
                        <QrTab onScanSuccess={handleQrAssocSuccess} onLogout={onLogout} />
                    </div>
                </div>
            )}

            {/* HEADER EVENTO */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 shadow-xl z-10">
                <div className="flex gap-2 items-center mb-2">
                    <select 
                        className="flex-1 bg-gray-900 text-white p-2.5 rounded-lg border border-gray-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedEvento?.id || ''}
                        onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}
                    >
                        {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
                    </select>
                    {isMaster && (
                        <div className="flex gap-1">
                            <button onClick={() => startEdit('evento')} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg"><Plus size={20}/></button>
                            <button onClick={() => startEdit('evento', selectedEvento)} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg"><Edit2 size={20}/></button>
                        </div>
                    )}
                </div>
                
                {selectedEvento && !editMode && (
                    <div className="mt-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                        <p className="text-xs text-gray-300 italic mb-2">{selectedEvento.sinossi || 'Nessuna sinossi disponibile.'}</p>
                        <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                            <span className="flex items-center gap-1"><MapPin size={12} className="text-red-500"/> {selectedEvento.luogo || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-amber-500"><Calendar size={12}/> PC: {selectedEvento.pc_guadagnati}</span>
                            <span className="flex items-center gap-1 text-indigo-400"><Users size={12}/> {selectedEvento.staff_assegnato?.length} STAFF</span>
                        </div>
                    </div>
                )}
            </div>

            {/* EDITOR INTEGRATO (MASTER ONLY) */}
            {isMaster && editMode && (
                <div className="p-4 bg-gray-800 border-b-2 border-indigo-500 space-y-4 overflow-y-auto max-h-[60vh] z-20 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-indigo-400 uppercase italic">Editor {editMode}</h3>
                        <button onClick={() => setEditMode(null)}><X className="text-gray-500" /></button>
                    </div>
                    
                    <div className="space-y-4 pb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Titolo / Nome</label>
                            <input className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700 focus:border-indigo-500 outline-none"
                                value={formData.titolo || formData.nome || ''}
                                onChange={e => setFormData({...formData, titolo: e.target.value, nome: e.target.value})} />
                        </div>

                        {editMode === 'evento' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">Data Inizio</label>
                                    <input type="datetime-local" className="w-full bg-gray-900 p-2 rounded-lg text-sm border border-gray-700"
                                        value={formData.data_inizio?.slice(0, 16) || ''}
                                        onChange={e => setFormData({...formData, data_inizio: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">Data Fine</label>
                                    <input type="datetime-local" className="w-full bg-gray-900 p-2 rounded-lg text-sm border border-gray-700"
                                        value={formData.data_fine?.slice(0, 16) || ''}
                                        onChange={e => setFormData({...formData, data_fine: e.target.value})} />
                                </div>
                            </div>
                        )}

                        {editMode === 'giorno' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">Inizio Turno</label>
                                    <input type="datetime-local" className="w-full bg-gray-900 p-2 rounded-lg text-sm border border-gray-700"
                                        value={formData.data_ora_inizio?.slice(0, 16) || ''}
                                        onChange={e => setFormData({...formData, data_ora_inizio: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">Fine Turno</label>
                                    <input type="datetime-local" className="w-full bg-gray-900 p-2 rounded-lg text-sm border border-gray-700"
                                        value={formData.data_ora_fine?.slice(0, 16) || ''}
                                        onChange={e => setFormData({...formData, data_ora_fine: e.target.value})} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Descrizione / Sinossi</label>
                            <textarea className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700 h-28 text-sm focus:border-indigo-500 outline-none"
                                value={formData.sinossi || formData.sinossi_breve || formData.descrizione_ampia || ''}
                                onChange={e => setFormData({...formData, sinossi: e.target.value, sinossi_breve: e.target.value, descrizione_ampia: e.target.value})} />
                        </div>

                        {editMode === 'quest' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black ml-1">Orario Indicativo</label>
                                    <input type="time" className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700"
                                        value={formData.orario_indicativo || ''}
                                        onChange={e => setFormData({...formData, orario_indicativo: e.target.value})} />
                                </div>
                                <div className="bg-amber-900/20 p-4 rounded-2xl border border-amber-900/50 space-y-2">
                                    <label className="text-[10px] text-amber-500 uppercase font-black flex items-center gap-2">
                                        <Info size={14}/> Props & Materiale di Scena
                                    </label>
                                    <textarea className="w-full bg-gray-900 p-3 rounded-xl text-sm h-20 text-amber-100 placeholder-amber-900 border border-amber-900/30 outline-none"
                                        placeholder="Esempio: 3 casse di legno, 1 fiala blu, documenti cifrati..."
                                        value={formData.props || ''}
                                        onChange={e => setFormData({...formData, props: e.target.value})} />
                                </div>
                            </>
                        )}

                        <div className="flex gap-2 sticky bottom-0 bg-gray-800 pt-4 border-t border-gray-700">
                            <button onClick={handleSave} className="flex-1 bg-emerald-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                                <Save size={20}/> SALVA
                            </button>
                            <button onClick={() => setEditMode(null)} className="flex-1 bg-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                <X size={20}/> ANNULLA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TIMELINE GIORNI E QUEST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-10 custom-scrollbar">
                {selectedEvento?.giorni.length === 0 && (
                    <div className="text-center py-20 text-gray-600">
                        <Calendar size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="font-mono text-sm uppercase">Nessun giorno pianificato per questo evento.</p>
                        {isMaster && <button onClick={() => startEdit('giorno')} className="mt-4 text-emerald-500 underline font-bold">Aggiungi Giorno</button>}
                    </div>
                )}

                {selectedEvento?.giorni.map(giorno => (
                    <div key={giorno.id} className="relative pl-6 border-l-2 border-emerald-500/20">
                        {/* HEADER GIORNO */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full border-4 border-gray-900 shadow-glow-emerald"></div>
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-emerald-400 font-black text-xl tracking-tight uppercase italic">
                                    {new Date(giorno.data_ora_inizio).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h2>
                                <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                    <Clock size={10}/> 
                                    {new Date(giorno.data_ora_inizio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                    — 
                                    {new Date(giorno.data_ora_fine).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            {isMaster && (
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit('quest', { giorno: giorno.id })} className="p-2 bg-emerald-900/30 text-emerald-400 rounded-lg hover:bg-emerald-900/50"><Plus size={16}/></button>
                                    <button onClick={() => startEdit('giorno', giorno)} className="p-2 bg-gray-800 text-gray-400 rounded-lg"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete('giorno', giorno.id)} className="p-2 bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                                </div>
                            )}
                        </div>

                        {/* ELENCO QUEST */}
                        <div className="space-y-6">
                            {giorno.quests.map(quest => (
                                <div key={quest.id} className="bg-gray-800/40 rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                                    {/* Header Quest */}
                                    <div className="bg-gray-800/80 p-4 border-b border-gray-700/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-900/20">
                                                <Clock size={18}/>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 font-mono block leading-none">{quest.orario_indicativo.slice(0,5)}</span>
                                                <h3 className="font-black text-indigo-300 uppercase tracking-tight">{quest.titolo}</h3>
                                            </div>
                                        </div>
                                        {isMaster && (
                                            <div className="flex gap-2">
                                                <button onClick={() => startEdit('quest', quest)} className="text-gray-400 hover:text-indigo-400"><Edit2 size={18}/></button>
                                                <button onClick={() => handleDelete('quest', quest.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18}/></button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 space-y-5">
                                        {/* Descrizione */}
                                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                                            {quest.descrizione_ampia}
                                        </div>

                                        {/* Props (Highlight) */}
                                        {quest.props && (
                                            <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-2xl flex gap-3 items-start">
                                                <div className="bg-amber-600 text-white p-1.5 rounded-lg"><Info size={14}/></div>
                                                <div className="text-xs text-amber-200/80">
                                                    <span className="font-black text-amber-500 uppercase text-[9px] block mb-1">Materiale di Scena</span>
                                                    {quest.props}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            {/* PnG Necessari */}
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Users size={12}/> PnG Sequenziali
                                                </h4>
                                                <div className="space-y-2">
                                                    {quest.png_richiesti.map((png, idx) => (
                                                        <div key={png.id} className="flex items-center justify-between bg-gray-900/60 p-3 rounded-2xl border border-gray-700/50">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black bg-indigo-600/20 text-indigo-400 w-5 h-5 flex items-center justify-center rounded-full border border-indigo-400/30">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm font-bold">{png.personaggio_details.nome}</span>
                                                            </div>
                                                            <span className="text-[9px] font-mono text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded-lg">
                                                                {png.staffer_details?.username || 'DA ASSEGNARE'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Mostri Generici */}
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Swords size={12}/> Combat Table
                                                </h4>
                                                {quest.mostri_presenti.map(m => (
                                                    <div key={m.id} className="bg-gray-900/80 p-4 rounded-3xl border border-gray-700/50 shadow-inner">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <span className="block font-black text-red-400 text-sm uppercase tracking-tight">{m.template_details.nome}</span>
                                                                <span className="text-[9px] text-gray-500 font-mono">STAFF: {m.staffer_details?.username || 'LIBERO'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/5">
                                                                <button onClick={() => handleHpChange(m.id, -1)} className="w-8 h-8 bg-red-600 text-white rounded-full font-black shadow-lg">-</button>
                                                                <div className="px-2 flex flex-col items-center">
                                                                    <span className="text-lg font-black leading-none">{m.punti_vita}</span>
                                                                    <span className="text-[8px] font-black text-gray-500">HP</span>
                                                                </div>
                                                                <button onClick={() => handleHpChange(m.id, 1)} className="w-8 h-8 bg-emerald-600 text-white rounded-full font-black shadow-lg">+</button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 text-[9px] border-t border-white/5 pt-3 mb-3">
                                                            <span className="flex items-center gap-1 font-bold"><Shield size={10} className="text-blue-400"/> ARM: {m.armatura}</span>
                                                            <span className="flex items-center gap-1 font-bold"><Heart size={10} className="text-purple-400"/> GUS: {m.guscio}</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {m.template_details.attacchi.map(att => (
                                                                <div key={att.id} className="text-[10px] text-gray-400 bg-black/20 p-2 rounded-xl flex justify-between border border-white/5">
                                                                    <span className="font-bold text-gray-200">{att.nome_attacco}</span>
                                                                    <span className="text-red-400 italic">{att.descrizione_danno}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Vista Setup */}
                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <Eye size={12}/> QR Setup (Manifesti & Inventari)
                                            </h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {quest.viste_previste.map(vista => (
                                                    <div key={vista.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${vista.qr_code ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-gray-900 border-gray-700'}`}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{vista.tipo}</span>
                                                            <span className="text-sm font-bold text-white">{vista.manifesto_details?.titolo || vista.inventario_details?.nome || "Elemento Tecnico"}</span>
                                                            {vista.qr_code && <span className="text-[8px] text-emerald-400/50 font-mono mt-1">LINKED: {vista.qr_code}</span>}
                                                        </div>
                                                        <button 
                                                            onClick={() => setScanningForVista(vista.id)}
                                                            className={`p-3 rounded-2xl shadow-lg transition-transform active:scale-90 ${vista.qr_code ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                        >
                                                            <QrCode size={20} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
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