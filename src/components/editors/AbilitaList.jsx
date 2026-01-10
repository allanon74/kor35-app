import React, { useState, useEffect } from 'react';
import { staffGetAbilitaList, staffDeleteAbilita } from '../../api';
import MasterGenericList from './MasterGenericList'; // Riutilizziamo il componente lista generico se esiste, altrimenti cloniamo OggettoList

const AbilitaList = ({ onAdd, onEdit, onLogout }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        staffGetAbilitaList(onLogout)
            .then(data => setItems(data || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Sei sicuro di voler eliminare questa abilità?")) {
            try {
                await staffDeleteAbilita(id, onLogout);
                loadData();
            } catch (error) {
                console.error("Errore cancellazione", error);
                alert("Errore durante la cancellazione");
            }
        }
    };

    // Configurazione Colonne
    const columns = [
        { key: 'nome', label: 'Nome', primary: true },
        { key: 'caratteristica_nome', label: 'Caratteristica', render: (row) => row.caratteristica?.nome || '-' },
        { key: 'costo_pc', label: 'Costo PC' },
        { key: 'tipo', label: 'Tipo', render: (row) => row.is_tratto_aura ? 'Tratto Aura' : 'Standard' }
    ];

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-wider">Database Abilità</h2>
                <button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm shadow-lg transition-all">
                    + Nuova Abilità
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-10">Caricamento in corso...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900 text-gray-500 uppercase font-black text-xs">
                            <tr>
                                {columns.map(col => <th key={col.key} className="p-3">{col.label}</th>)}
                                <th className="p-3 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-3 font-bold text-white">{item.nome}</td>
                                    <td className="p-3">{item.caratteristica?.nome || '-'}</td>
                                    <td className="p-3">{item.costo_pc}</td>
                                    <td className="p-3">
                                        {item.is_tratto_aura ? 
                                            <span className="text-purple-400 text-xs font-bold px-2 py-1 bg-purple-900/50 rounded">AURA</span> : 
                                            <span className="text-blue-400 text-xs font-bold px-2 py-1 bg-blue-900/50 rounded">STD</span>
                                        }
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-white font-bold text-xs uppercase">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-300 font-bold text-xs uppercase">Del</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AbilitaList;