import React, { useState, useEffect } from 'react';
import { 
    getEventi, associaQrAVista, getRisorseEditor,
    createEvento, updateEvento, deleteEvento,
    createGiorno, updateGiorno, deleteGiorno,
    createQuest, updateQuest, deleteQuest,
    addPngToQuest, addMostroToQuest, addVistaToQuest,
    removePngFromQuest, removeMostroFromQuest, removeVistaFromQuest,
    addFaseToQuest, removeFaseFromQuest,updateFase,
    addTaskToFase, removeTaskFromFase,
    // AGGIUNTI GLI IMPORT MANCANTI PER LO STAFF:
    staffCreateOffGame, staffDeleteOffGame,
    fetchAuthenticated 
} from '../api';
import { useCharacter } from './CharacterContext';
import { Plus, X, Save, Printer } from 'lucide-react';
import EventoSection from './EventoSection';
import GiornoSection from './GiornoSection';
import QrTab from './QrTab'; 
import RichTextEditor from './RichTextEditor';

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
            
            // Ordina eventi per data e trova il primo futuro
            const sortedEvents = evData.sort((a, b) => new Date(a.data_inizio) - new Date(b.data_inizio));
            const today = new Date().setHours(0,0,0,0);
            const nextEvent = sortedEvents.find(ev => new Date(ev.data_inizio) >= today) || sortedEvents[0];
            
            setEventi(sortedEvents);
            setRisorse(risData);
            if (nextEvent) setSelectedEvento(nextEvent);
        } catch (e) { console.error("Errore caricamento plot:", e); } finally { setLoading(false); }
    };

    const refreshData = async () => {
        const data = await getEventi(onLogout);
        const sorted = data.sort((a, b) => new Date(a.data_inizio) - new Date(b.data_inizio));
        setEventi(sorted);
        if (selectedEvento) {
            const updated = sorted.find(e => e.id === selectedEvento.id);
            setSelectedEvento(updated || sorted[0]);
        }
    };

    const formatDateForInput = (iso) => iso ? iso.split('T')[0] : '';
    const formatDateTimeForInput = (iso) => iso ? iso.slice(0, 16) : '';
    const formatTimeForInput = (time) => time ? time.slice(0, 5) : '';

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
            } else if (editMode === 'fase') { // <--- NUOVO BLOCCO
                if (formData.id) {
                    await updateFase(formData.id, formData, onLogout);
                }
             } 
            setEditMode(null);
            refreshData();
        } catch (e) { alert("Errore durante il salvataggio."); console.error(e); }
    };

    const handleDeleteEvento = async (id) => { if(window.confirm("Eliminare intero evento?")) { await deleteEvento(id, onLogout); refreshData(); } };
    const handleDeleteGiorno = async (id) => { if(window.confirm("Eliminare giorno?")) { await deleteGiorno(id, onLogout); refreshData(); } };

    const questHandlers = {
    onAddSub: async (tipo, payload) => {
        try {
            if (tipo === 'fase') await addFaseToQuest(payload, onLogout);
            if (tipo === 'task') await addTaskToFase(payload, onLogout);
            if (tipo === 'vista') {
                const vistaPayload = { 
                    quest: parseInt(payload.quest), 
                    tipo: payload.tipo, 
                    manifesto: payload.tipo === 'MAN' ? parseInt(payload.contentId) : null, 
                    inventario: payload.tipo === 'INV' ? parseInt(payload.contentId) : null 
                };
                await addVistaToQuest(payload.quest, vistaPayload, onLogout);
            }
            refreshData();
        } catch (error) {
            console.error("Errore aggiunta:", error);
            alert("Errore nell'operazione: " + error.message);
        }
    },
    onRemoveSub: async (tipo, id) => {
        if (tipo === 'fase') await removeFaseFromQuest(id, onLogout);
        if (tipo === 'task') await removeTaskFromFase(id, onLogout);
        if (tipo === 'vista') await removeVistaFromQuest(id, onLogout);
        if (tipo === 'quest') { if (window.confirm("Eliminare quest?")) await deleteQuest(id, onLogout); }
        refreshData();
    },
    onStatChange: async (id, field, delta) => {
        // Cerchiamo il task nell'albero dei dati per avere il valore attuale
        const allTasks = selectedEvento.giorni
            .flatMap(g => g.quests)
            .flatMap(q => q.fasi || [])
            .flatMap(f => f.tasks || []);
        
        const task = allTasks.find(t => t.id === id);
        if (!task) return;

        await fetchAuthenticated(`/plot/api/tasks/${id}/`, { 
            method: 'PATCH', 
            body: JSON.stringify({ [field]: (task[field] || 0) + delta }) 
        }, onLogout);
        refreshData();
    },
    onScanQr: (id) => setScanningForVista(id)
};

    if (loading) return <div className="h-full flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

    const handlePrintEvent = () => {
        if (!selectedEvento || !giorni) return;

        const printWindow = window.open('', '_blank');
        
        // Stili CSS per la stampa
        const styles = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');
                body { font-family: 'Roboto', sans-serif; color: #000; line-height: 1.4; padding: 20px; max-width: 210mm; margin: 0 auto; }
                h1 { font-size: 24pt; text-transform: uppercase; border-bottom: 4px solid #000; margin-bottom: 10px; }
                h2 { font-size: 18pt; margin-top: 30px; background: #eee; padding: 5px 10px; border-left: 10px solid #333; page-break-after: avoid; }
                h3 { font-size: 14pt; margin-top: 20px; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; page-break-after: avoid; }
                h4 { font-size: 11pt; margin-top: 15px; font-weight: 900; text-transform: uppercase; color: #666; page-break-after: avoid; }
                
                .meta { font-size: 10pt; color: #666; margin-bottom: 20px; font-style: italic; }
                .synopsis { font-size: 11pt; text-align: justify; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; background: #f9f9f9; }
                
                .quest-block { margin-left: 0px; margin-bottom: 30px; page-break-inside: avoid; }
                .fase-block { margin-left: 20px; border-left: 2px solid #ccc; padding-left: 15px; margin-bottom: 15px; }
                
                .task-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 5px; }
                .task-card { border: 1px solid #000; padding: 8px; font-size: 9pt; background: #fff; page-break-inside: avoid; }
                .task-header { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px; display: flex; justify-content: space-between; }
                .task-role { text-transform: uppercase; font-size: 7pt; background: #000; color: #fff; padding: 1px 4px; border-radius: 3px; }
                
                .stats { font-family: monospace; margin-top: 5px; border-top: 1px dotted #ccc; padding-top: 2px; }
                
                /* Classi Rich Text semplificate per la stampa */
                .rich-text p { margin-bottom: 5px; }
                .rich-text ul { padding-left: 20px; margin: 5px 0; }
                
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                    h2 { page-break-before: always; } /* Ogni giorno nuova pagina */
                    h2:first-of-type { page-break-before: avoid; }
                }
            </style>
        `;

        // Contenuto HTML
        let content = `
            <html>
            <head><title>Report Evento: ${selectedEvento.titolo}</title>${styles}</head>
            <body>
                <h1>${selectedEvento.titolo}</h1>
                <div class="meta">
                    Data Inizio: ${new Date(selectedEvento.data_inizio).toLocaleDateString('it-IT')} | 
                    Luogo: ${selectedEvento.luogo || 'N/D'} | 
                    Staff Assegnato: ${selectedEvento.staff_assegnato?.length || 0}
                </div>
                
                <div class="synopsis">
                    <strong>Sinossi Evento:</strong><br/>
                    ${selectedEvento.descrizione || 'Nessuna descrizione disponibile.'}
                </div>
        `;

        // Loop Giorni
        giorni.forEach((giorno, idx) => {
            content += `
                <h2>GIORNO ${idx + 1}: ${new Date(giorno.data).toLocaleDateString('it-IT')}</h2>
                <p><em>${giorno.sinossi_breve || ''}</em></p>
            `;

            // Loop Quest
            if (giorno.quests && giorno.quests.length > 0) {
                giorno.quests.forEach(quest => {
                    content += `
                        <div class="quest-block">
                            <h3>QUEST: ${quest.titolo}</h3>
                            <p>${quest.descrizione || ''}</p>
                    `;

                    // Loop Fasi
                    if (quest.fasi && quest.fasi.length > 0) {
                        // Ordina le fasi
                        const fasiOrdinate = [...quest.fasi].sort((a,b) => a.ordine - b.ordine);
                        
                        fasiOrdinate.forEach(fase => {
                            content += `
                                <div class="fase-block">
                                    <h4>FASE ${fase.ordine}: ${fase.titolo}</h4>
                                    ${fase.descrizione ? `<p class="rich-text">${fase.descrizione}</p>` : ''}
                            `;

                            // Loop Tasks
                            if (fase.tasks && fase.tasks.length > 0) {
                                content += `<div class="task-grid">`;
                                fase.tasks.forEach(task => {
                                    const nomeTarget = task.personaggio_details?.nome 
                                        || task.mostro_details?.nome 
                                        || (task.compito_offgame === 'REG' ? 'Regole' : task.compito_offgame === 'AIU' ? 'Aiuto' : 'Allestimento');
                                    
                                    const ruoloLabel = task.ruolo === 'MOSTRO' ? 'MOSTRO' : task.ruolo === 'PNG' ? 'PNG' : 'OFF-GAME';
                                    
                                    content += `
                                        <div class="task-card">
                                            <div class="task-header">
                                                <span>${nomeTarget}</span>
                                                <span class="task-role">${ruoloLabel}</span>
                                            </div>
                                            <div style="margin-bottom:4px;"><strong>Staff:</strong> ${task.staffer_details?.username || 'N/D'}</div>
                                            <div class="rich-text">${task.istruzioni || ''}</div>
                                            ${task.ruolo === 'MOSTRO' ? `<div class="stats">PV: ${task.punti_vita} | ARM: ${task.armatura}</div>` : ''}
                                        </div>
                                    `;
                                });
                                content += `</div>`; // chiude grid
                            } else {
                                content += `<p style="font-size:9pt; color:#999;">Nessun incarico assegnato.</p>`;
                            }

                            content += `</div>`; // chiude fase
                        });
                    } else {
                        content += `<p>Nessuna fase operativa definita.</p>`;
                    }

                    content += `</div>`; // chiude quest
                });
            } else {
                content += `<p>Nessuna quest pianificata per questo giorno.</p>`;
            }
        });

        content += `
            <script>
                window.onload = function() { window.print(); }
            </script>
            </body></html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white pb-20 overflow-hidden">
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex gap-2 z-40 shadow-xl">
                <select className="flex-1 bg-gray-900 p-3 rounded-xl border border-gray-800 font-black text-indigo-400 outline-none cursor-pointer"
                    value={selectedEvento?.id || ''} onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id === parseInt(e.target.value)))}>
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo.toUpperCase()}</option>)}
                </select>
                {isMaster && (
                    <button onClick={() => startEdit('evento')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg"><Plus size={24}/></button>
                )}
                <button 
                    onClick={handlePrintEvent}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    title="Stampa Report Completo"
                >
                    <Printer size={20} />
                    <span className="hidden md:inline font-bold text-xs uppercase">Stampa Report</span>
                </button>
            </div>

            {editMode && (
                <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-3xl border-t-4 border-indigo-500 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase text-indigo-400 italic tracking-widest">Editor {editMode}</h3>
                            <button onClick={() => setEditMode(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X/></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ... Codice form invariato ... */}
                            {editMode === 'evento' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 focus:border-indigo-500 outline-none" value={formData.titolo || ''} onChange={e => setFormData({...formData, titolo: e.target.value})} />
                                    </div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase px-1">Inizio</label><input type="date" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formatDateForInput(formData.data_inizio)} onChange={e => setFormData({...formData, data_inizio: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase px-1">Fine</label><input type="date" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formatDateForInput(formData.data_fine)} onChange={e => setFormData({...formData, data_fine: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase px-1">Luogo</label><input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formData.luogo || ''} onChange={e => setFormData({...formData, luogo: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase px-1">PC Guadagnati</label><input type="number" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formData.pc_guadagnati || 0} onChange={e => setFormData({...formData, pc_guadagnati: e.target.value})} /></div>
                                    <div className="md:col-span-2">
                                        <RichTextEditor label="Sinossi" value={formData.sinossi} onChange={val => setFormData({...formData, sinossi: val})} />
                                    </div>
                                </>
                            )}
                            {editMode === 'giorno' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo Giorno</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 focus:border-indigo-500 outline-none" value={formData.titolo || ''} onChange={e => setFormData({...formData, titolo: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <RichTextEditor label="Sinossi Breve (Sottotitolo)" value={formData.sinossi_breve} onChange={val => setFormData({...formData, sinossi_breve: val})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Inizio (Data/Ora)</label>
                                        <input type="datetime-local" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formatDateTimeForInput(formData.data_ora_inizio)} onChange={e => setFormData({...formData, data_ora_inizio: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Fine (Data/Ora)</label>
                                        <input type="datetime-local" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formatDateTimeForInput(formData.data_ora_fine)} onChange={e => setFormData({...formData, data_ora_fine: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <RichTextEditor label="Descrizione Plot Completa (Info Master)" value={formData.descrizione_completa} onChange={val => setFormData({...formData, descrizione_completa: val})} />
                                    </div>
                                </>
                            )}
                            {editMode === 'quest' && (
                                <>
                                    <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo Quest</label><input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formData.titolo || ''} onChange={e => setFormData({...formData, titolo: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase px-1">Orario</label><input type="time" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" value={formatTimeForInput(formData.orario_indicativo)} onChange={e => setFormData({...formData, orario_indicativo: e.target.value})} /></div>
                                    <div className="md:col-span-2">
                                        <RichTextEditor label="Descrizione Ampia" value={formData.descrizione_ampia} onChange={val => setFormData({...formData, descrizione_ampia: val})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <RichTextEditor label="Props (Materiale di scena)" value={formData.props} onChange={val => setFormData({...formData, props: val})} />
                                    </div>
                                </>
                            )}
                            {editMode === 'fase' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Titolo Fase</label>
                                        <input className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.titolo || ''} 
                                            onChange={e => setFormData({...formData, titolo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Ordine</label>
                                        <input type="number" className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700" 
                                            value={formData.ordine || 0} 
                                            onChange={e => setFormData({...formData, ordine: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Descrizione (Opzionale)</label>
                                        <textarea className="w-full bg-gray-900 p-3 rounded-lg border border-gray-700 h-24 resize-none" 
                                            value={formData.descrizione || ''} 
                                            onChange={e => setFormData({...formData, descrizione: e.target.value})} />
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

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedEvento && (
                    <EventoSection 
                        evento={selectedEvento} 
                        isMaster={isMaster} 
                        risorse={risorse}
                        onEdit={startEdit} 
                        onDelete={handleDeleteEvento}
                        onUpdateEvento={(id, data) => { updateEvento(id, data, onLogout); refreshData(); }}
                        onAddGiorno={() => startEdit('giorno')}
                    />
                )}
                <div className="p-4 space-y-16">
                    {selectedEvento?.giorni.map((giorno, gIdx) => (
                        <GiornoSection key={giorno.id} giorno={giorno} gIdx={gIdx} isMaster={isMaster} risorse={risorse}
                            onEdit={startEdit} onDelete={handleDeleteGiorno} 
                            onAddQuest={(gid) => startEdit('quest', { giorno: gid })}
                            questHandlers={questHandlers} />
                    ))}
                </div>
            </div>

            {scanningForVista && (
                <div className="fixed inset-0 z-110 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-gray-900 border-b border-gray-800 shadow-xl">
                        <span className="font-black text-white uppercase italic tracking-widest">Associa QR Fisico</span>
                        <button onClick={() => setScanningForVista(null)} className="px-4 py-2 bg-red-600 rounded-lg text-xs font-black shadow-lg">X ANNULLA</button>
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