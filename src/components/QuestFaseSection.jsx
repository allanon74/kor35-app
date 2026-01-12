import React, { useState, useMemo } from 'react';
import { Swords, Users, Monitor, Trash, Heart, Shield, Edit2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
// 1. IMPORTIAMO I COMPONENTI RICH TEXT
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';

const QuestFaseSection = ({ fase, isMaster, risorse, onAddTask, onRemoveTask, onStatChange, onEdit, onDelete }) => {
    const [formOpen, setFormOpen] = useState(false);
    // Nota: 'istruzioni' ora conterrà HTML, non testo semplice
    const [form, setForm] = useState({ ruolo: 'PNG', staffer: '', personaggio: '', mostro_template: '', compito_offgame: 'REG', istruzioni: '' });

    // FIX: Logica di filtro PnG robusta (gestisce ID, Oggetti e Nomi)
    const pngFiltrati = useMemo(() => {
        if (!form.staffer) return [];
        const stafferId = parseInt(form.staffer);
        
        const stafferObj = risorse.staff?.find(s => s.id === stafferId);
        const stafferName = stafferObj ? stafferObj.username : "";

        return risorse.png?.filter(p => {
            let isMio = false;
            if (p.proprietario_id !== undefined) {
                isMio = (p.proprietario_id === stafferId);
            } else if (typeof p.proprietario === 'object' && p.proprietario !== null) {
                isMio = (p.proprietario.id === stafferId);
            } else if (typeof p.proprietario === 'string') {
                isMio = (p.proprietario === stafferName);
            } else {
                isMio = (p.proprietario == stafferId);
            }
            const isPnG = (p.giocante === false || p.giocante === undefined);
            return isMio && isPnG;
        }) || [];
    }, [form.staffer, risorse.png, risorse.staff]);

    const groupedTasks = useMemo(() => {
        return {
            PNG: fase.tasks?.filter(t => t.ruolo === 'PNG') || [],
            MOSTRO: fase.tasks?.filter(t => t.ruolo === 'MOSTRO') || [],
            OFF: fase.tasks?.filter(t => !['PNG', 'MOSTRO'].includes(t.ruolo)) || []
        };
    }, [fase.tasks]);

    const renderTaskCard = (task) => (
        // Rimosso h-full fisso o restrizioni severe per permettere l'espansione
        <div key={task.id} className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex flex-col gap-2 group relative hover:border-indigo-500/50 transition-colors">
            {/* Intestazione Card */}
            <div className="flex justify-between items-start">
                <div className={`p-1.5 rounded-md shrink-0 ${task.ruolo === 'MOSTRO' ? 'bg-red-900/20 text-red-500' : 'bg-indigo-900/20 text-indigo-400'}`}>
                    {task.ruolo === 'MOSTRO' ? <Swords size={14}/> : task.ruolo === 'PNG' ? <Users size={14}/> : <Monitor size={14}/>}
                </div>
                {isMaster && (
                    <button onClick={() => onRemoveTask(task.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                        <Trash size={12}/>
                    </button>
                )}
            </div>

            {/* Contenuto Card */}
            <div>
                <div className="text-[11px] font-black uppercase text-gray-100 leading-tight mb-1">
                    {task.personaggio_details?.nome || task.mostro_details?.nome || (task.compito_offgame === 'REG' ? 'Regole' : task.compito_offgame === 'AIU' ? 'Aiuto' : 'Allestimento')}
                </div>
                <div className="text-[9px] text-indigo-400 font-bold mb-2">@{task.staffer_details?.username}</div>
                
                {/* 2. RICH TEXT DISPLAY: Rimosso max-h e overflow per espansione verticale */}
                {task.istruzioni && (
                    <div className="bg-black/40 p-2 rounded border border-gray-800/50 text-gray-300">
                        {/* Ridimensioniamo leggermente il testo del RichTextDisplay per adattarlo alla card */}
                        <div className="scale-90 origin-top-left w-[110%]">
                             <RichTextDisplay content={task.istruzioni} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Card (Stats Mostri) */}
            {task.ruolo === 'MOSTRO' && (
                <div className="mt-auto pt-2 border-t border-gray-800/50 flex gap-2 justify-center">
                    <StatMini icon={<Heart size={10}/>} value={task.punti_vita} onUp={() => onStatChange(task.id, 'punti_vita', 1)} onDown={() => onStatChange(task.id, 'punti_vita', -1)} color="text-red-500" />
                    <StatMini icon={<Shield size={10}/>} value={task.armatura} onUp={() => onStatChange(task.id, 'armatura', 1)} onDown={() => onStatChange(task.id, 'armatura', -1)} color="text-gray-400" />
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 overflow-hidden mb-6 shadow-lg">
            {/* Header Fase */}
            <div className="bg-gray-800/80 px-4 py-2 flex justify-between items-center border-b border-gray-700 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">FASE {fase.ordine}</span>
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">{fase.titolo}</span>
                </div>
                
                {isMaster && (
                    <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                        <button onClick={onEdit} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700 transition-colors" title="Modifica Fase">
                            <Edit2 size={14}/>
                        </button>
                        <div className="w-px h-3 bg-gray-700 mx-0.5"></div>
                        <button onClick={() => { if(window.confirm("Eliminare questa fase e tutti i suoi task?")) onDelete(); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-700 transition-colors" title="Elimina Fase">
                            <Trash size={14}/>
                        </button>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-6">
                
                {/* Gruppo PNG - Items start per allineare in alto e permettere altezze diverse */}
                {groupedTasks.PNG.length > 0 && (
                    <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Users size={12}/> Personaggi Non Giocanti
                            <div className="h-px bg-gray-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
                            {groupedTasks.PNG.map(renderTaskCard)}
                        </div>
                    </div>
                )}

                {/* Gruppo MOSTRI */}
                {groupedTasks.MOSTRO.length > 0 && (
                    <div>
                        <div className="text-[10px] font-black text-red-900/70 uppercase mb-2 flex items-center gap-2 mt-4">
                            <Swords size={12}/> Minacce & Mostri
                            <div className="h-px bg-red-900/20 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
                            {groupedTasks.MOSTRO.map(renderTaskCard)}
                        </div>
                    </div>
                )}

                {/* Gruppo OFF-GAME */}
                {groupedTasks.OFF.length > 0 && (
                    <div>
                        <div className="text-[10px] font-black text-gray-600 uppercase mb-2 flex items-center gap-2 mt-4">
                            <Monitor size={12}/> Gestione Off-Game
                            <div className="h-px bg-gray-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
                            {groupedTasks.OFF.map(renderTaskCard)}
                        </div>
                    </div>
                )}

                {/* Form Collapsible */}
                {isMaster && (
                    <div className="mt-6">
                        {!formOpen ? (
                            <button 
                                onClick={() => setFormOpen(true)}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus size={14}/> Nuovo Incarico Staff
                            </button>
                        ) : (
                            <div className="bg-gray-950/50 rounded-lg border border-indigo-500/30 overflow-hidden animation-fade-in">
                                <div className="bg-indigo-900/10 px-3 py-2 border-b border-indigo-500/20 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase">Configura Nuovo Task</span>
                                    <button onClick={() => setFormOpen(false)} className="text-indigo-400 hover:text-white"><ChevronUp size={14}/></button>
                                </div>
                                <div className="p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase">Membro Staff</label>
                                            <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700 focus:border-indigo-500 outline-none" 
                                                value={form.staffer} onChange={e => setForm({...form, staffer: e.target.value, personaggio: ''})}>
                                                <option value="">Seleziona Staffer...</option>
                                                {risorse.staff?.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase">Ruolo / Tipo</label>
                                            <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-indigo-400 border border-gray-700 font-black focus:border-indigo-500 outline-none" 
                                                value={form.ruolo} onChange={e => setForm({...form, ruolo: e.target.value})}>
                                                <option value="PNG">RUOLO: PnG</option>
                                                <option value="MOSTRO">RUOLO: Mostro</option>
                                                <option value="OFF">RUOLO: Off-Game</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Selettori Dinamici */}
                                    {form.ruolo === 'PNG' && (
                                        <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700 focus:border-indigo-500 outline-none" 
                                            value={form.personaggio} onChange={e => setForm({...form, personaggio: e.target.value})} disabled={!form.staffer}>
                                            <option value="">{form.staffer ? "Seleziona PnG dello Staffer..." : "Prima seleziona un membro dello Staff"}</option>
                                            {pngFiltrati.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                        </select>
                                    )}
                                    {form.ruolo === 'MOSTRO' && (
                                        <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700 focus:border-indigo-500 outline-none" 
                                            value={form.mostro_template} onChange={e => setForm({...form, mostro_template: e.target.value})}>
                                            <option value="">Seleziona Template Mostro...</option>
                                            {risorse.templates?.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        </select>
                                    )}
                                    {form.ruolo === 'OFF' && (
                                        <div className="flex gap-2 justify-center bg-gray-900 p-2 rounded border border-gray-700">
                                            {[ ['REG', 'Regole'], ['AIU', 'Aiuto'], ['ALL', 'Allestimento'] ].map(([v, l]) => (
                                                <label key={v} className={`flex-1 text-center py-1 rounded cursor-pointer text-[10px] font-bold transition-colors ${form.compito_offgame === v ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-500'}`}>
                                                    <input type="radio" className="hidden" value={v} checked={form.compito_offgame === v} onChange={e => setForm({...form, compito_offgame: e.target.value})} /> {l}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* 3. RICH TEXT EDITOR PER L'INSERIMENTO */}
                                    <div className="h-64 border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                                        <RichTextEditor 
                                            value={form.istruzioni} 
                                            onChange={(val) => setForm({...form, istruzioni: val})}
                                            placeholder="Istruzioni dettagliate per lo staffer..."
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => setFormOpen(false)} className="flex-1 py-1.5 rounded border border-gray-700 text-gray-400 text-[10px] font-bold hover:bg-gray-800">ANNULLA</button>
                                        <button onClick={() => { onAddTask({ fase: fase.id, ...form }); setForm({...form, personaggio: '', mostro_template: '', istruzioni: ''}); setFormOpen(false); }} 
                                            className="flex-2 bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded font-black text-[10px] uppercase text-white shadow-lg shadow-indigo-900/20">
                                            Conferma Incarico
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatMini = ({ icon, value, onUp, onDown, color }) => (
    <div className={`flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-gray-800 ${color}`}>
        {icon} <span className="text-[10px] font-black w-3 text-center text-white">{value}</span>
        <div className="flex flex-col ml-0.5">
            <button onClick={onUp} className="text-[7px] leading-none hover:text-white hover:bg-gray-700 px-0.5 rounded">▲</button>
            <button onClick={onDown} className="text-[7px] leading-none hover:text-white hover:bg-gray-700 px-0.5 rounded">▼</button>
        </div>
    </div>
);

export default QuestFaseSection;