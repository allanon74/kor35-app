import React from 'react';
import { Calendar, Clock, Edit2, Trash, Plus } from 'lucide-react';
import QuestItem from './QuestItem';

const GiornoSection = ({ giorno, gIdx, isMaster, risorse, onEdit, onDelete, onAddQuest, questHandlers }) => {
    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
    const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' }) : "";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-emerald-500/30 pb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Giorno {gIdx + 1}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                            <Calendar size={12}/> {formatDate(giorno.data_ora_inizio)}
                        </span>
                    </div>
                    <h2 className="text-xl font-black italic text-white uppercase">{giorno.sinossi_breve || "Senza Titolo"}</h2>
                    <div className="flex items-center gap-3 text-[10px] text-emerald-400 font-bold uppercase italic">
                        <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(giorno.data_ora_inizio)} - {formatTime(giorno.data_ora_fine)}</span>
                    </div>
                </div>
                {isMaster && (
                    <div className="flex gap-2">
                        <button onClick={() => onEdit('giorno', giorno)} className="text-gray-500 hover:text-white p-1"><Edit2 size={16}/></button>
                        <button onClick={() => onDelete('giorno', giorno.id)} className="text-red-900 hover:text-red-500 p-1"><Trash size={16}/></button>
                        <button onClick={() => onAddQuest(giorno.id)} className="bg-emerald-600 px-3 py-1.5 rounded text-[10px] font-black uppercase">+ Quest</button>
                    </div>
                )}
            </div>

            <div className="grid gap-8">
                {giorno.quests.map(quest => (
                    <QuestItem key={quest.id} quest={quest} isMaster={isMaster} risorse={risorse} onEdit={onEdit} {...questHandlers} />
                ))}
            </div>
        </div>
    );
};

export default GiornoSection;