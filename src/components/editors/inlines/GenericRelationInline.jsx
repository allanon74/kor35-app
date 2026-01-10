import React from 'react';
import { Trash2, Plus } from 'lucide-react';

const GenericRelationInline = ({ 
    title, 
    items, 
    options, 
    valueKey = 'valore', 
    targetKey, // Chiave dell'oggetto target (es. 'punteggio', 'requisito')
    onChange, 
    labelFinder = (opt) => opt.nome 
}) => {
    
    const handleAdd = () => {
        const newItem = { [targetKey]: null, [valueKey]: 1 };
        onChange([...items, newItem]);
    };

    const handleRemove = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <h4 className="font-bold text-gray-300 uppercase text-xs">{title}</h4>
                <button onClick={handleAdd} className="text-emerald-500 hover:text-emerald-400">
                    <Plus size={16} />
                </button>
            </div>
            
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <select 
                            value={item[targetKey] || ""} 
                            onChange={(e) => handleChange(idx, targetKey, parseInt(e.target.value))}
                            className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        >
                            <option value="">- Seleziona -</option>
                            {options.map(opt => (
                                <option key={opt.id} value={opt.id}>{labelFinder(opt)}</option>
                            ))}
                        </select>
                        
                        {/* Se esiste la chiave valore, mostra l'input numerico */}
                        {valueKey && (
                            <input 
                                type="number" 
                                value={item[valueKey]} 
                                onChange={(e) => handleChange(idx, valueKey, parseInt(e.target.value))}
                                className="w-20 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white text-right"
                            />
                        )}

                        <button onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-400">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-600 text-xs italic">Nessun elemento assegnato.</p>}
            </div>
        </div>
    );
};

export default GenericRelationInline;