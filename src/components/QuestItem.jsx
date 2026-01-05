import React, { useState } from 'react';
import { Users, Swords, QrCode as QrIcon, Heart, Shield, Layout, Trash, X, Plus, ChevronDown, ChevronUp, Zap, Package, Edit2, UserCheck } from 'lucide-react';

const QuestItem = ({ quest, isMaster, risorse, onAddSub, onRemoveSub, onStatChange, onSaveNotes, onEdit, onScanQr }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl border-l-4 border-l-indigo-500/50">
            {/* Header Quest */}
            <div className="bg-gray-800/80 px-4 py-3 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-black text-xs shadow-inner">
                        {quest.orario_indicativo?.slice(0, 5)}
                    </div>
                    <h3 className="font-black text-base text-white uppercase tracking-tight">{quest.titolo}</h3>
                </div>
                {isMaster && (
                    <div className="flex gap-2">
                        <button onClick={() => onEdit('quest', quest)} className="text-gray-500 hover:text-white transition-colors p-1"><Edit2 size={16}/></button>
                        <button onClick={() => onRemoveSub('quest', quest.id)} className="text-red-900 hover:text-red-500 transition-colors p-1"><Trash size={16}/></button>
                    </div>
                )}
            </div>

            <div className="p-5 space-y-6">
                {/* Dettagli Quest */}
                <div className="space-y-4">
                    {quest.descrizione_ampia && (
                        <div className="text-sm text-gray-300 leading-relaxed italic bg-black/10 p-3 rounded-xl border border-gray-800">
                            {quest.descrizione_ampia}
                        </div>
                    )}
                    {quest.props && (
                        <div className="flex items-start gap-3 bg-amber-900/10 border border-amber-900/20 p-3 rounded-xl">
                            <Package size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-black text-amber-500 uppercase block mb-1">Materiale di Scena:</span>
                                <p className="text-xs text-amber-100/80">{quest.props}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Colonna PnG */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1 px-1"><Users size={12}/> PnG Richiesti</span>
                        <div className="bg-gray-900/50 rounded-xl p-2 space-y-1">
                            {quest.png_richiesti.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-[11px]">
                                    <span className="font-bold">{p.personaggio_details?.nome}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-400 font-bold italic"><UserCheck size={10} className="inline mr-1"/>{p.staffer_details?.username || '---'}</span>
                                        {isMaster && <button onClick={() => onRemoveSub('png', p.id)} className="text-red-500"><X size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                            {isMaster && (
                                <div className="flex gap-1 pt-2">
                                    <select id={`p-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-gray-700">
                                        <option value="">PnG...</option>
                                        {risorse.png.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                                    </select>
                                    <button onClick={() => onAddSub('png', { quest: quest.id, personaggio: document.getElementById(`p-${quest.id}`).value })} className="bg-indigo-600 p-1.5 rounded hover:bg-indigo-500"><Plus size={14}/></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonna Mostri */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 px-1"><Swords size={12}/> Combat Table</span>
                        <div className="bg-gray-900/50 rounded-xl p-2 space-y-2">
                            {quest.mostri_presenti.map(m => (
                                <div key={m.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-[11px] font-black uppercase text-red-400">{m.template_details?.nome}</div>
                                            <div className="text-[10px] text-indigo-400 font-bold italic"><UserCheck size={10} className="inline mr-1"/>{m.staffer_details?.username || 'DA ASSEGNARE'}</div>
                                        </div>
                                        {isMaster && <button onClick={() => onRemoveSub('mostro', m.id)} className="text-red-900"><Trash size={12}/></button>}
                                    </div>

                                    {/* PV PA PS */}
                                    <div className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-gray-800/50">
                                        <StatCounter label={<Heart size={10} className="text-red-500 fill-red-500"/>} value={m.punti_vita} onUp={() => onStatChange(m.id, 'punti_vita', 1)} onDown={() => onStatChange(m.id, 'punti_vita', -1)} />
                                        <StatCounter label={<Shield size={10} className="text-gray-400"/>} value={m.armatura} onUp={() => onStatChange(m.id, 'armatura', 1)} onDown={() => onStatChange(m.id, 'armatura', -1)} />
                                        <StatCounter label={<Layout size={10} className="text-indigo-400"/>} value={m.guscio} onUp={() => onStatChange(m.id, 'guscio', 1)} onDown={() => onStatChange(m.id, 'guscio', -1)} />
                                    </div>

                                    {/* Attacchi */}
                                    <div className="mt-2 space-y-1">
                                        {m.template_details?.attacchi?.map((att, idx) => (
                                            <div key={idx} className="text-[9px] text-amber-500 font-mono bg-amber-900/10 px-2 py-1 rounded border border-amber-900/20">
                                                <span className="font-black uppercase">{att.nome_attacco}:</span> {att.descrizione_danno}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Costume e Note Toggle */}
                                    <button onClick={() => setExpanded(!expanded)} className="w-full mt-2 text-[8px] font-black uppercase text-gray-500 hover:text-indigo-400 py-1 border-t border-gray-800/50">
                                        {expanded ? "Chiudi Info Staff" : "Mostra Costume / Note"}
                                    </button>
                                    {expanded && (
                                        <div className="mt-2 space-y-2">
                                            <div className="p-2 bg-indigo-950/20 border border-indigo-500/20 rounded text-[10px] italic">
                                                <span className="font-bold text-indigo-400 block uppercase">Costume:</span> {m.template_details?.costume || "Nessuna nota costume."}
                                            </div>
                                            <textarea id={`note-${m.id}`} defaultValue={m.note_per_staffer} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-[10px] h-16" placeholder="Note specifiche per questa quest..."/>
                                            <button onClick={() => onSaveNotes(m.id, document.getElementById(`note-${m.id}`).value)} className="w-full bg-emerald-600/20 text-emerald-400 py-1 rounded text-[8px] font-black uppercase">Salva Note</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isMaster && (
                                <div className="flex gap-1 pt-2">
                                    <select id={`m-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none">
                                        <option value="">Mostro...</option>
                                        {risorse.templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                    </select>
                                    <select id={`ms-${quest.id}`} className="flex-1 bg-gray-800 p-1.5 rounded text-[10px] outline-none border border-indigo-900/50">
                                        <option value="">Staff...</option>
                                        {risorse.staff.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                    </select>
                                    <button onClick={() => onAddSub('mostro', { quest: quest.id, template: document.getElementById(`m-${quest.id}`).value, staffer: document.getElementById(`ms-${quest.id}`).value })} className="bg-red-600 p-1.5 rounded hover:bg-red-500"><Plus size={14}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sezione QR */}
                <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-2">
                    {quest.viste_previste.map(v => (
                        <div key={v.id} className="flex items-center gap-2 bg-black/40 border border-gray-800 p-1.5 rounded-xl group">
                            <div className={`p-1.5 rounded-lg ${v.qr_code ? 'bg-emerald-500/10' : 'bg-gray-800'}`}>
                                <QrIcon size={14} className={v.qr_code ? 'text-emerald-500' : 'text-gray-600'} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-200">{v.manifesto_details?.nome || v.manifesto_details?.titolo || v.inventario_details?.nome || 'OGGETTO'}</span>
                            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onScanQr(v.id)} className="text-indigo-400 p-1"><QrIcon size={12}/></button>
                                {isMaster && <button onClick={() => onRemoveSub('vista', v.id)} className="text-red-900 p-1"><X size={12}/></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Sub-component per i contatori
const StatCounter = ({ label, value, onUp, onDown }) => (
    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 rounded border border-gray-800">
        {label}
        <span className="text-xs font-black w-4 text-center">{value}</span>
        <div className="flex flex-col gap-0.5 ml-1">
            <button onClick={onUp} className="bg-gray-700 text-[8px] w-3 h-3 rounded hover:bg-gray-600">+</button>
            <button onClick={onDown} className="bg-gray-700 text-[8px] w-3 h-3 rounded hover:bg-gray-600">-</button>
        </div>
    </div>
);

export default QuestItem;