import React, { useState, useMemo } from 'react';
import { Swords, Users, Monitor, Trash, Heart, Shield } from 'lucide-react';

const QuestFaseSection = ({ fase, isMaster, risorse, onAddTask, onRemoveTask, onStatChange }) => {
    const [form, setForm] = useState({ ruolo: 'PNG', staffer: '', personaggio: '', mostro_template: '', compito_offgame: 'REG', istruzioni: '' });

    const pngFiltrati = useMemo(() => {
        if (!form.staffer) return [];
        return risorse.png?.filter(p => p.proprietario === parseInt(form.staffer)) || [];
    }, [form.staffer, risorse.png]);

    return (
        <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 overflow-hidden mb-4 shadow-lg">
            <div className="bg-gray-800/50 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Fase {fase.ordine}: {fase.titolo}</span>
            </div>

            <div className="p-3 space-y-3">
                {fase.tasks?.map(task => (
                    <div key={task.id} className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex justify-between items-start group">
                        <div className="flex gap-3 min-w-0">
                            <div className={`p-2 rounded shrink-0 ${task.ruolo === 'MOSTRO' ? 'bg-red-900/20 text-red-500' : 'bg-indigo-900/20 text-indigo-400'}`}>
                                {task.ruolo === 'MOSTRO' ? <Swords size={16}/> : task.ruolo === 'PNG' ? <Users size={16}/> : <Monitor size={16}/>}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase text-white truncate">
                                    {task.personaggio_details?.nome || task.mostro_details?.nome || (task.compito_offgame === 'REG' ? 'Regole' : task.compito_offgame === 'AIU' ? 'Aiuto' : 'Allestimento')}
                                </div>
                                <div className="text-[9px] text-gray-500 font-bold">Staff: {task.staffer_details?.username}</div>
                                {task.istruzioni && <div className="text-[10px] text-gray-400 italic mt-1 leading-tight">{task.istruzioni}</div>}
                                {task.ruolo === 'MOSTRO' && (
                                    <div className="mt-2 flex gap-2">
                                        <StatMini icon={<Heart size={10}/>} value={task.punti_vita} onUp={() => onStatChange(task.id, 'punti_vita', 1)} onDown={() => onStatChange(task.id, 'punti_vita', -1)} color="text-red-500" />
                                        <StatMini icon={<Shield size={10}/>} value={task.armatura} onUp={() => onStatChange(task.id, 'armatura', 1)} onDown={() => onStatChange(task.id, 'armatura', -1)} color="text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {isMaster && <button onClick={() => onRemoveTask(task.id)} className="text-red-900 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={14}/></button>}
                    </div>
                ))}

                {isMaster && (
                    <div className="mt-4 p-3 bg-black/20 rounded-lg border border-dashed border-gray-700 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <select className="bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700" value={form.staffer} onChange={e => setForm({...form, staffer: e.target.value})}>
                                <option value="">Scegli Staff...</option>
                                {risorse.staff?.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                            </select>
                            <select className="bg-gray-900 p-2 rounded text-[10px] text-indigo-400 border border-gray-700 font-black" value={form.ruolo} onChange={e => setForm({...form, ruolo: e.target.value})}>
                                <option value="PNG">RUOLO: PnG</option>
                                <option value="MOSTRO">RUOLO: Mostro</option>
                                <option value="OFF">RUOLO: Off-Game</option>
                            </select>
                        </div>
                        {form.ruolo === 'PNG' && (
                            <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700" value={form.personaggio} onChange={e => setForm({...form, personaggio: e.target.value})}>
                                <option value="">PnG Propri...</option>
                                {pngFiltrati.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        )}
                        {form.ruolo === 'MOSTRO' && (
                            <select className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700" value={form.mostro_template} onChange={e => setForm({...form, mostro_template: e.target.value})}>
                                <option value="">Template Mostro...</option>
                                {risorse.templates?.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        )}
                        {form.ruolo === 'OFF' && (
                            <div className="flex gap-4 justify-center bg-gray-800 p-2 rounded border border-gray-700">
                                {[ ['REG', 'Regole'], ['AIU', 'Aiuto'], ['ALL', 'Allestimento'] ].map(([v, l]) => (
                                    <label key={v} className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                                        <input type="radio" value={v} checked={form.compito_offgame === v} onChange={e => setForm({...form, compito_offgame: e.target.value})} /> {l}
                                    </label>
                                ))}
                            </div>
                        )}
                        <textarea placeholder="Istruzioni specifiche..." className="w-full bg-gray-900 p-2 rounded text-[10px] text-white border border-gray-700 h-16 resize-none" value={form.istruzioni} onChange={e => setForm({...form, istruzioni: e.target.value})} />
                        <button onClick={() => { onAddTask({ fase: fase.id, ...form }); setForm({...form, personaggio: '', mostro_template: '', istruzioni: ''}); }} className="w-full bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded font-black text-[10px] uppercase">Aggiungi Task</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatMini = ({ icon, value, onUp, onDown, color }) => (
    <div className={`flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-gray-800 ${color}`}>
        {icon} <span className="text-[10px] font-black w-3 text-center text-white">{value}</span>
        <div className="flex flex-col">
            <button onClick={onUp} className="text-[8px] hover:text-white">+</button>
            <button onClick={onDown} className="text-[8px] hover:text-white">-</button>
        </div>
    </div>
);

export default QuestFaseSection;