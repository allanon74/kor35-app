import React from 'react';
import { Edit, Trash2, Layers, ListOrdered } from 'lucide-react';

const TabellaList = ({ tiers, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {tiers.map(tier => (
                <div key={tier.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg hover:border-gray-500 transition-all flex flex-col gap-3 group relative overflow-hidden">
                    
                    {/* Header Card */}
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/30 mb-2 inline-block">
                                {tier.tipo || 'Generico'}
                            </span>
                            <h3 className="text-xl font-black text-gray-100 leading-tight">{tier.nome}</h3>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-gray-400 text-sm z-10">
                        <div className="flex items-center gap-1.5" title="Numero Abilità">
                            <ListOrdered size={16} className="text-emerald-500" />
                            <span className="font-mono font-bold text-gray-200">{tier.abilita_count || 0}</span>
                            <span className="text-xs">abilità</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-700/50 z-10">
                        <button 
                            onClick={() => onEdit(tier)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors text-sm font-bold"
                        >
                            <Edit size={16} /> Modifica
                        </button>
                        <button 
                            onClick={() => onDelete(tier.id)}
                            className="flex items-center justify-center bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-3 rounded-lg transition-colors border border-red-900/50"
                            title="Elimina Tabella"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Decoration Background */}
                    <Layers className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32 rotate-12 pointer-events-none group-hover:scale-110 transition-transform" />
                </div>
            ))}

            {tiers.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                    <Layers size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nessuna tabella trovata</p>
                    <p className="text-sm">Crea una nuova tabella per iniziare</p>
                </div>
            )}
        </div>
    );
};

export default TabellaList;