import React, { useState, useEffect } from 'react';
import { staffGetAbilitaList, staffDeleteAbilita } from '../../api';
import MasterGenericList from './MasterGenericList';

const AbilitaList = ({ onAdd, onEdit, onLogout }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Caricamento Dati
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await staffGetAbilitaList(onLogout);
            setItems(data || []);
        } catch (error) {
            console.error("Errore caricamento abilità:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [onLogout]);

    // 2. Gestione Cancellazione
    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa abilità?")) return;
        try {
            await staffDeleteAbilita(id, onLogout);
            // Aggiorna la lista locale rimuovendo l'elemento
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        }
    };
    
    const columns = [
        { key: 'nome', label: 'Nome', width: '30%', render: (row) => <span className="font-bold text-white">{row.nome}</span> },
        { key: 'costo_pc', label: 'Costo PC', width: '15%', align: 'center', render: (row) => row.costo_pc },
        { key: 'costo_crediti', label: 'Crediti', width: '15%', align: 'center', render: (row) => row.costo_crediti },
        { 
            key: 'tipo', 
            label: 'Tipo', 
            width: '20%',
            align: 'center',
            render: (row) => row.is_tratto_aura ? 
                <span className="text-purple-400 text-[10px] font-bold px-2 py-0.5 bg-purple-900/50 rounded border border-purple-500/30 uppercase tracking-wide">
                    AURA {row.aura_riferimento?.nome} (Lv.{row.livello_riferimento})
                </span> : 
                <span className="text-gray-500 text-xs">-</span> 
        }
    ];

    // Configurazione filtri (Opzionale, ma utile)
    const filterConfig = [
        { 
            key: 'is_tratto_aura', 
            label: 'Tipo', 
            options: [{ id: true, label: 'Tratti Aura' }, { id: false, label: 'Standard' }] 
        }
    ];

    return (
        <MasterGenericList
            title="Database Abilità"
            items={items}           // Passiamo i dati caricati
            loading={loading}       // Passiamo lo stato di caricamento
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={handleDelete} // Passiamo la funzione che gestisce l'eliminazione
            columns={columns}
            filterConfig={filterConfig}
            sortLogic={(a, b) => (a.nome || "").localeCompare(b.nome || "")}
        />
    );
};

export default AbilitaList;