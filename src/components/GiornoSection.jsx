import React, { useState } from 'react'; 
import { Calendar, Clock, Edit2, Trash, Plus, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import QuestItem from './QuestItem';

const GiornoSection = ({ giorno, gIdx, isMaster, risorse, onEdit, onDelete, onAddQuest, questHandlers }) => {
    const [showDettagli, setShowDettagli] = useState(false);
    
    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
    const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' }) : "";

    return (
        <div className="space-y-6 w-full max-w-full">
            <div className="flex justify-between items-start border-b border-emerald-500/30 pb-3 gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap">Giorno {gIdx + 1}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 truncate">
                            <Calendar size={12}/> {formatDate(giorno.data_ora_inizio)}
                        </span>
                    </div>
                    
                    {/* Titolo Principale */}
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tight truncate">
                        {giorno.titolo || `Giorno ${gIdx + 1}`}
                    </h2>
                    
                    {/* Sinossi Breve */}
                    <div 
                        className="text-emerald-400/80 text-xs font-bold uppercase italic mb-2 wrap-break-words whitespace-pre-wrap w-full"
                        dangerouslySetInnerHTML={{ __html: giorno.sinossi_breve }}
                    />

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-emerald-400 font-bold uppercase italic">
                        <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={12}/> {formatTime(giorno.data_ora_inizio)} - {formatTime(giorno.data_ora_fine)}</span>
                        
                        {/* Bottone per espandere i dettagli completi */}
                        {giorno.descrizione_completa && (
                            <button 
                                onClick={() => setShowDettagli(!showDettagli)}
                                className="flex items-center gap-1 text-white bg-emerald-900/40 px-2 py-1 rounded hover:bg-emerald-800 transition-colors"
                            >
                                <BookOpen size={10}/> 
                                {showDettagli ? "Nascondi Plot" : "Leggi Plot Completo"}
                                {showDettagli ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                            </button>
                        )}
                    </div>
                </div>

                {isMaster && (
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => onEdit('giorno', giorno)} className="text-gray-500 hover:text-white p-1"><Edit2 size={16}/></button>
                        <button onClick={() => onDelete(giorno.id)} className="text-red-900 hover:text-red-500 p-1"><Trash size={16}/></button>
                        <button onClick={() => onAddQuest(giorno.id)} className="bg-emerald-600 px-3 py-1.5 rounded text-[10px] font-black uppercase whitespace-nowrap">+ Quest</button>
                    </div>
                )}
            </div>

            {/* Sezione Collassata della Descrizione Completa */}
            {showDettagli && giorno.descrizione_completa && (
                <div className="bg-emerald-950/20 border-l-2 border-emerald-500 p-4 rounded-r-lg animate-in fade-in w-full">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-2">Dettagli Plot / Note Master</h4>
                    <div 
                        className="text-gray-300 text-sm italic ql-editor-view wrap-break-words whitespace-pre-wrap w-full"
                        dangerouslySetInnerHTML={{ __html: giorno.descrizione_completa }}
                    />
                </div>
            )}

            <div className="grid gap-8 w-full">
                {giorno.quests.map(quest => (
                    <QuestItem key={quest.id} quest={quest} isMaster={isMaster} risorse={risorse} onEdit={onEdit} {...questHandlers} />
                ))}
            </div>
        </div>
    );
};

export default GiornoSection;