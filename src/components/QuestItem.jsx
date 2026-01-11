import React, { useState } from 'react';
// Aggiungi l'icona 'Whistle' (fischietto) o 'Monitor' per l'arbitro se disponibile, altrimenti usiamo Shield o User
import { Users, Swords, QrCode as QrIcon, Heart, Shield, Layout, Trash, X, Plus, ChevronDown, ChevronUp, Package, Edit2, UserCheck, Eye, Monitor } from 'lucide-react';

const QuestItem = ({ quest, isMaster, risorse, onAddSub, onRemoveSub, onStatChange, onSaveNotes, onEdit, onScanQr }) => {
    const [expandedMostri, setExpandedMostri] = useState({});
    const [newVista, setNewVista] = useState({ tipo: 'MAN', contentId: '' });
    
    // Stato locale per l'aggiunta staff offgame
    const [newOffGame, setNewOffGame] = useState({ staffer: '', compito: '' });

    const pngDisponibili = risorse.png?.filter(p => p.giocante === false) || [];

    const toggleMonster = (id) => {
        setExpandedMostri(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl border-l-4 border-l-indigo-500/50 w-full max-w-full">
            {/* Header Quest */}
            <div className="bg-gray-800/80 px-4 py-3 flex justify-between items-center border-b border-gray-700 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-black text-xs shadow-inner shrink-0">
                        {quest.orario_indicativo?.slice(0, 5)}
                    </div>
                    <h3 className="font-black text-base text-white uppercase tracking-tight truncate">{quest.titolo}</h3>
                </div>
                {isMaster && (
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => onEdit('quest', quest)} className="text-gray-500 hover:text-white transition-colors p-1"><Edit2 size={16}/></button>
                        <button onClick={() => onRemoveSub('quest', quest.id)} className="text-red-900 hover:text-red-500 transition-colors p-1"><Trash size={16}/></button>
                    </div>
                )}
            </div>

            <div className="p-5 space-y-6">
                {/* Dettagli Quest */}
                <div className="space-y-4 w-full min-w-0">
                    {quest.descrizione_ampia && (
                        <div className="w-full min-w-0 overflow-hidden">
                            {/* FIX: Sostituito 'wrap-wrap-wrap-break-words' (non standard) con 'wrap-wrap-break-words' e aggiunto 'overflow-hidden' al container */}
                            <div 
                                className="text-sm text-gray-300 leading-relaxed italic bg-black/10 p-3 rounded-xl border border-gray-800 ql-editor-view whitespace-pre-wrap! wrap-break-words! break-all! w-full max-w-full"
                                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                                dangerouslySetInnerHTML={{ __html: quest.descrizione_ampia }}
                            />
                        </div>
                    )}
                    {quest.props && (
                        <div className="flex items-start gap-3 bg-amber-900/10 border border-amber-900/20 p-3 rounded-xl w-full min-w-0">
                            <Package size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black text-amber-500 uppercase block mb-1">Materiale di Scena:</span>
                                <div 
                                    className="text-xs text-amber-100/80 ql-editor-view wrap-wrap-break-words whitespace-pre-wrap w-full max-w-full"
                                    dangerouslySetInnerHTML={{ __html: quest.props }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Griglia Colonne: PnG, Mostri e Staff Off-game */}
                {/* Modifica Layout: passiamo a 3 colonne su schermi medi/grandi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Colonna PnG */}
                    <div className="space-y-2 min-w-0">
                        <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1 px-1"><Users size={12}/> PnG Richiesti</span>
                        <div className="bg-gray-900/50 rounded-xl p-2 space-y-1 h-full">
                            {quest.png_richiesti.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-[11px]">
                                    <span className="font-bold truncate max-w-[150px]">{p.personaggio_details?.nome}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-indigo-400 font-bold italic"><UserCheck size={10} className="inline mr-1"/>{p.staffer_details?.username || '---'}</span>
                                        {isMaster && <button onClick={() => onRemoveSub('png', p.id)} className="text-red-500"><X size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                            {isMaster && (
                                <div className="flex gap-1 pt-2">
                                    <select id={`p-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-gray-700 text-gray-300">
                                        <option value="">PnG...</option>
                                        {pngDisponibili.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                                    </select>
                                    <button onClick={() => onAddSub('png', { quest: quest.id, personaggio: document.getElementById(`p-${quest.id}`).value })} className="bg-indigo-600 p-1.5 rounded hover:bg-indigo-500 text-white"><Plus size={14}/></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Colonna Staff Off-Game (NUOVA SEZIONE) */}
                    <div className="space-y-2 min-w-0">
                        <span className="text-[10px] font-black text-cyan-500 uppercase flex items-center gap-1 px-1"><Monitor size={12}/> Staff Off-Game / Arbitri</span>
                        <div className="bg-gray-900/50 rounded-xl p-2 space-y-1 h-full">
                            {quest.staff_offgame?.map(s => (
                                <div key={s.id} className="flex flex-col p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-[11px] gap-1 relative group">
                                    <div className="flex justify-between items-center">
                                        <span className="text-cyan-400 font-bold italic"><UserCheck size={10} className="inline mr-1"/>{s.staffer_details?.username}</span>
                                        {isMaster && <button onClick={() => onRemoveSub('offgame', s.id)} className="text-red-900 hover:text-red-500"><X size={14}/></button>}
                                    </div>
                                    <span className="text-gray-400 text-[10px] border-t border-gray-800/50 pt-1 mt-0.5">{s.compito}</span>
                                </div>
                            ))}
                            
                            {isMaster && (
                                <div className="flex flex-col gap-1 pt-2 border-t border-gray-800/50 mt-2">
                                    <select 
                                        className="w-full bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-gray-700 text-gray-300"
                                        value={newOffGame.staffer}
                                        onChange={(e) => setNewOffGame({...newOffGame, staffer: e.target.value})}
                                    >
                                        <option value="">Seleziona Staff...</option>
                                        {risorse.staff?.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                    </select>
                                    <div className="flex gap-1">
                                        <input 
                                            type="text" 
                                            placeholder="Compito (es. Arbitro)..." 
                                            className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-gray-700 text-gray-300"
                                            value={newOffGame.compito}
                                            onChange={(e) => setNewOffGame({...newOffGame, compito: e.target.value})}
                                        />
                                        <button 
                                            onClick={() => {
                                                if(!newOffGame.staffer || !newOffGame.compito) return alert("Compila staff e compito");
                                                onAddSub('offgame', { quest: quest.id, ...newOffGame });
                                                setNewOffGame({ staffer: '', compito: '' });
                                            }} 
                                            className="bg-cyan-600 p-1.5 rounded hover:bg-cyan-500 text-white"
                                        >
                                            <Plus size={14}/>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Colonna Mostri */}
                    <div className="space-y-2 min-w-0">
                        <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 px-1"><Swords size={12}/> Combat Table</span>
                        {/* ... (Il contenuto dei mostri rimane identico a prima, non riportato per brevità se non richiesto, ma nel file finale deve esserci) ... */}
                        <div className="bg-gray-900/50 rounded-xl p-2 space-y-2">
                            {quest.mostri_presenti.map(m => (
                                <div key={m.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 shadow-sm w-full max-w-full">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-black uppercase text-red-400 truncate">{m.template_details?.nome}</div>
                                            <div className="text-[10px] text-indigo-400 font-bold italic truncate"><UserCheck size={10} className="inline mr-1"/>{m.staffer_details?.username || 'DA ASSEGNARE'}</div>
                                        </div>
                                        {isMaster && <button onClick={() => onRemoveSub('mostro', m.id)} className="text-red-900 hover:text-red-500 shrink-0"><Trash size={12}/></button>}
                                    </div>

                                    {/* Contatori Statistiche */}
                                    <div className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-gray-800/50">
                                        <StatCounter label={<Heart size={10} className="text-red-500 fill-red-500"/>} value={m.punti_vita} onUp={() => onStatChange(m.id, 'punti_vita', 1)} onDown={() => onStatChange(m.id, 'punti_vita', -1)} />
                                        <StatCounter label={<Shield size={10} className="text-gray-400"/>} value={m.armatura} onUp={() => onStatChange(m.id, 'armatura', 1)} onDown={() => onStatChange(m.id, 'armatura', -1)} />
                                        <StatCounter label={<Layout size={10} className="text-indigo-400"/>} value={m.guscio} onUp={() => onStatChange(m.id, 'guscio', 1)} onDown={() => onStatChange(m.id, 'guscio', -1)} />
                                    </div>

                                    {/* Pulsante Toggle Dettagli */}
                                    <button 
                                        onClick={() => toggleMonster(m.id)} 
                                        className="w-full mt-3 flex items-center justify-center gap-1 text-[9px] font-black uppercase text-gray-400 hover:text-indigo-400 py-1.5 border-t border-gray-800/50 transition-colors"
                                    >
                                        {expandedMostri[m.id] ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                        {expandedMostri[m.id] ? "Nascondi Dettagli" : "Vedi Attacchi e Note"}
                                    </button>
                                    
                                    {/* SEZIONE COLLASSABILE */}
                                    {expandedMostri[m.id] && (
                                        <div className="mt-2 space-y-3 animate-in fade-in duration-200 border-t border-gray-800 pt-2 w-full min-w-0">
                                            
                                            {/* Lista Attacchi */}
                                            {m.template_details?.attacchi?.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-amber-600 uppercase block">Capacità Offensive:</span>
                                                    {m.template_details.attacchi.map((att, idx) => (
                                                        <div key={idx} className="text-[9px] text-amber-500 font-mono bg-amber-900/10 px-2 py-1 rounded border border-amber-900/20 wrap-wrap-break-words whitespace-pre-wrap w-full">
                                                            <span className="font-black uppercase tracking-tighter">{att.nome_attacco}:</span> {att.descrizione_danno}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                             
                                             {/* ... Resto del codice mostri identico ... */}
                                             {/* Nota: Assicurati di cambiare anche qui wrap-wrap-wrap-break-words con wrap-wrap-break-words se necessario */}
                                             {m.template_details?.costume && (
                                                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded p-2 w-full">
                                                     <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Costume & Tratti:</span> 
                                                     <div 
                                                        className="text-[10px] text-indigo-200/80 ql-editor-view wrap-wrap-break-words whitespace-pre-wrap" 
                                                        dangerouslySetInnerHTML={{__html: m.template_details.costume}} 
                                                     />
                                                </div>
                                            )}
                                             {/* ... */}
                                             <div className="space-y-1 pt-2 border-t border-dashed border-gray-800">
                                                <span className="text-[8px] font-black text-emerald-500 uppercase block">Note Tattiche Staffer (Istanza):</span>
                                                <textarea 
                                                    id={`note-${m.id}`} 
                                                    defaultValue={m.note_per_staffer} 
                                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-[10px] h-16 outline-none focus:border-emerald-500 resize-none text-gray-300" 
                                                    placeholder="Istruzioni specifiche per chi interpreta..."
                                                />
                                                <button 
                                                    onClick={() => onSaveNotes(m.id, document.getElementById(`note-${m.id}`).value)} 
                                                    className="w-full bg-emerald-600/20 text-emerald-400 py-1 rounded text-[8px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                                                >
                                                    Salva Note Istanza
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isMaster && (
                                <div className="flex gap-1 pt-2 border-t border-gray-800">
                                    <select id={`m-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-gray-700 text-gray-300">
                                        <option value="">Mostro...</option>
                                        {risorse.templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                    </select>
                                    <select id={`ms-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-indigo-900/50 text-gray-300">
                                        <option value="">Staff...</option>
                                        {risorse.staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => {
                                            const tId = document.getElementById(`m-${quest.id}`).value;
                                            const sId = document.getElementById(`ms-${quest.id}`).value;
                                            if(!tId || !sId) return alert("Scegli mostro e staffer");
                                            onAddSub('mostro', { quest: quest.id, template: tId, staffer: sId });
                                        }} 
                                        className="bg-red-600 p-1.5 rounded hover:bg-red-500 shadow-lg text-white"
                                    >
                                        <Plus size={14}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sezione Viste e QR (Invariata) */}
                <div className="pt-4 border-t border-gray-800">
                   {/* ... Codice esistente delle Viste ... */}
                   {quest.viste_previste.map(v => (
                            <div key={v.id} className="flex items-center gap-2 bg-black/40 border border-gray-800 p-1.5 rounded-xl group shadow-sm max-w-full">
                                <div className={`p-1.5 rounded-lg ${v.qr_code ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                                    <QrIcon size={14} className={v.qr_code ? 'text-emerald-500' : 'text-gray-600'} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-gray-200 truncate max-w-[120px]">
                                        {v.manifesto_details?.nome || v.manifesto_details?.titolo || v.inventario_details?.nome || 'OGGETTO'}
                                    </span>
                                    <span className="text-[7px] text-gray-500 uppercase font-black">{v.tipo}</span>
                                </div>
                                <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onScanQr(v.id)} className="text-indigo-400 p-1 hover:text-white" title="Associa QR"><QrIcon size={12}/></button>
                                    {isMaster && <button onClick={() => onRemoveSub('vista', v.id)} className="text-red-900 p-1 hover:text-red-500"><X size={12}/></button>}
                                </div>
                            </div>
                        ))}
                        
                        {/* Aggiunta Nuova Vista (MAN/INV) */}
                        {isMaster && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/5 border border-dashed border-emerald-500/20 p-1.5 rounded-xl">
                                <select 
                                    className="bg-transparent text-[9px] font-bold text-emerald-500 outline-none" 
                                    value={newVista.tipo} 
                                    onChange={(e) => setNewVista({tipo: e.target.value, contentId: ''})}
                                >
                                    <option value="MAN">MAN</option>
                                    <option value="INV">INV</option>
                                </select>
                                <select 
                                    className="bg-transparent text-[9px] text-gray-400 outline-none max-w-[100px]" 
                                    value={newVista.contentId} 
                                    onChange={(e) => setNewVista({...newVista, contentId: e.target.value})}
                                >
                                    <option value="">Seleziona...</option>
                                    {newVista.tipo === 'INV' 
                                        ? risorse.inventari.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)
                                        : risorse.manifesti.map(m => <option key={m.id} value={m.id}>{m.nome || m.titolo}</option>)
                                    }
                                </select>
                                <button 
                                    onClick={() => {
                                        if(!newVista.contentId) return alert("Seleziona un contenuto");
                                        onAddSub('vista', { quest: quest.id, ...newVista });
                                        setNewVista({...newVista, contentId: ''});
                                    }} 
                                    className="text-emerald-500 hover:scale-110 transition-transform"
                                >
                                    <Plus size={16}/>
                                </button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};


const StatCounter = ({ label, value, onUp, onDown }) => (
    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 rounded border border-gray-800">
        {label}
        <span className="text-xs font-black w-4 text-center text-white">{value}</span>
        <div className="flex flex-col gap-0.5 ml-1">
            <button onClick={onUp} className="bg-gray-700 text-[8px] w-3 h-3 rounded hover:bg-gray-600 text-white">+</button>
            <button onClick={onDown} className="bg-gray-700 text-[8px] w-3 h-3 rounded hover:bg-gray-600 text-white">-</button>
        </div>
    </div>
);

export default QuestItem;