import React, { useState } from 'react';
import { 
    MapPin, Info, Edit2, Trash2, Calendar, 
    Users, Star, UserPlus, X, ChevronDown, ChevronUp, ShieldCheck 
} from 'lucide-react';

const EventoSection = ({ evento, isMaster, risorse, onEdit, onDelete, onUpdateEvento, onAddGiorno }) => {
    const [showPartecipanti, setShowPartecipanti] = useState(false);

    if (!evento) return null;

    // Helper per aggiungere/rimuovere ID dagli array Many-to-Many (staff e partecipanti)
    const handleListChange = async (fieldName, targetId, action) => {
        let currentList = evento[fieldName] || [];
        // Se il backend restituisce oggetti, estraiamo gli ID
        const currentIds = currentList.map(item => typeof item === 'object' ? item.id : item);
        
        let newIds;
        if (action === 'add') {
            if (currentIds.includes(parseInt(targetId))) return;
            newIds = [...currentIds, parseInt(targetId)];
        } else {
            newIds = currentIds.filter(id => id !== targetId);
        }

        // Chiamata al backend tramite la prop onUpdateEvento
        onUpdateEvento(evento.id, { [fieldName]: newIds });
    };

    return (
        <div className="bg-indigo-900/10 border-b border-gray-800 p-6 space-y-6 shadow-inner">
            {/* Header Evento */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black uppercase text-white tracking-tighter">{evento.titolo}</h1>
                        {isMaster && (
                            <button onClick={() => onEdit('evento', evento)} className="p-1.5 bg-gray-800 rounded-lg text-indigo-400 hover:text-white transition-colors">
                                <Edit2 size={18}/>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-gray-400 italic">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-indigo-400"/> {evento.luogo || 'Senza luogo'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} className="text-indigo-400"/> {new Date(evento.data_inizio).toLocaleDateString()} - {new Date(evento.data_fine).toLocaleDateString()}</span>
                        <span className="text-indigo-400 flex items-center gap-1"><Star size={12}/> {evento.pc_guadagnati} PC</span>
                    </div>
                </div>

                {isMaster && (
                    <div className="flex gap-2">
                        <button onClick={onAddGiorno} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 transition-all">
                            + Giorno
                        </button>
                        <button onClick={() => onDelete('evento', evento.id)} className="p-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={20}/>
                        </button>
                    </div>
                )}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-indigo-500 pl-4 bg-indigo-500/5 py-2 rounded-r">
                {evento.sinossi}
            </p>

            {/* SEZIONE STAFF (Sempre visibile) */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    <ShieldCheck size={14}/> Membri Staff Assegnati
                </div>
                <div className="flex flex-wrap gap-2">
                    {evento.staff_details?.map(user => (
                        <div key={user.id} className="flex items-center gap-2 bg-indigo-900/30 border border-indigo-500/30 px-2 py-1 rounded-full text-[11px] text-indigo-100">
                            <span className="font-bold">{user.username}</span>
                            {isMaster && (
                                <button onClick={() => handleListChange('staff_assegnato', user.id, 'remove')} className="text-indigo-400 hover:text-red-400">
                                    <X size={12}/>
                                </button>
                            )}
                        </div>
                    ))}
                    {isMaster && (
                        <div className="flex items-center gap-1 ml-2">
                            <select 
                                className="bg-gray-900 border border-gray-700 rounded text-[10px] p-1 outline-none focus:border-indigo-500"
                                onChange={(e) => {
                                    if(e.target.value) handleListChange('staff_assegnato', e.target.value, 'add');
                                    e.target.value = "";
                                }}
                            >
                                <option value="">Aggiungi Staff...</option>
                                {risorse.staff?.filter(s => !(evento.staff_assegnato || []).includes(s.id)).map(s => (
                                    <option key={s.id} value={s.id}>{s.username}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* SEZIONE PARTECIPANTI (Collassabile) */}
            <div className="border-t border-gray-800/50 pt-4">
                <button 
                    onClick={() => setShowPartecipanti(!showPartecipanti)}
                    className="flex items-center justify-between w-full text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Users size={14}/> Partecipanti ({evento.partecipanti?.length || 0})
                    </div>
                    {showPartecipanti ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>

                {showPartecipanti && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-wrap gap-2">
                            {/* Assumendo che il backend passi i nomi dei partecipanti in partecipanti_details */}
                            {evento.partecipanti_details?.map(char => (
                                <div key={char.id} className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-[11px] text-gray-300">
                                    <span>{char.nome}</span>
                                    {isMaster && (
                                        <button onClick={() => handleListChange('partecipanti', char.id, 'remove')} className="text-gray-500 hover:text-red-500">
                                            <X size={12}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isMaster && (
                            <div className="flex items-center gap-2 bg-gray-950/50 p-3 rounded-xl border border-gray-800">
                                <UserPlus size={14} className="text-emerald-500"/>
                                <select 
                                    className="bg-transparent text-[11px] text-gray-400 outline-none flex-1"
                                    onChange={(e) => {
                                        if(e.target.value) handleListChange('partecipanti', e.target.value, 'add');
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Iscrivi un personaggio all'evento...</option>
                                    {/* Usiamo risorse.png o risorse.personaggi se disponibili */}
                                    {(risorse.png || risorse.personaggi)?.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventoSection;