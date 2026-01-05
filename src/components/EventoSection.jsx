import React from 'react';
import { MapPin, Info, Edit2, Trash2, Calendar, Users, Star } from 'lucide-react';

const EventoSection = ({ evento, isMaster, onEdit, onDelete, onAddGiorno }) => {
    if (!evento) return null;

    return (
        <div className="bg-indigo-900/10 border-b border-gray-800 p-6 space-y-4 shadow-inner">
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

            <div className="space-y-3">
                <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-indigo-500 pl-4 bg-indigo-500/5 py-2 rounded-r">
                    {evento.sinossi}
                </p>
                
                {/* Info Staff/Partecipanti rapida se isMaster */}
                {isMaster && (
                    <div className="flex gap-4 text-[9px] font-black uppercase text-gray-500">
                        <span className="flex items-center gap-1"><Users size={10}/> Staff: {evento.staff_assegnato?.length || 0}</span>
                        <span className="flex items-center gap-1"><Users size={10}/> Partecipanti: {evento.partecipanti?.length || 0}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventoSection;