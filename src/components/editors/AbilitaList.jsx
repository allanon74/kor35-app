import React, { useState, useEffect } from 'react';
import { staffGetAbilitaList, staffDeleteAbilita } from '../../api';
import MasterGenericList from './MasterGenericList';

const AbilitaList = ({ onAdd, onEdit, onLogout }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(50);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    // 1. Caricamento Dati
    const loadData = async (targetPage = page) => {
        setLoading(true);
        try {
            const data = await staffGetAbilitaList(onLogout, { page: targetPage, pageSize });

            // Compatibilita: gestisce sia risposta paginata DRF che array legacy.
            if (Array.isArray(data)) {
                setItems(data || []);
                setTotalCount(data?.length || 0);
                setHasNext(false);
                setHasPrev(false);
                setPage(1);
            } else {
                setItems(data?.results || []);
                setTotalCount(data?.count || 0);
                setHasNext(Boolean(data?.next));
                setHasPrev(Boolean(data?.previous));
                setPage(targetPage);
            }
        } catch (error) {
            console.error("Errore caricamento abilità:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(1);
    }, [onLogout, pageSize]);

    // 2. Gestione Cancellazione
    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa abilità?")) return;
        try {
            await staffDeleteAbilita(id, onLogout);
            // Aggiorna la lista locale rimuovendo l'elemento
            setItems(prev => prev.filter(item => item.id !== id));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        }
    };
    
    const columns = [
        { key: 'nome', header: 'Nome', width: '30%', render: (row) => <span className="font-bold text-white">{row.nome}</span> },
        { key: 'costo_pc', header: 'Costo PC', width: '15%', align: 'center', render: (row) => row.costo_pc },
        { key: 'costo_crediti', header: 'Crediti', width: '15%', align: 'center', render: (row) => row.costo_crediti },
        { 
            key: 'tipo', 
            header: 'Tipo', 
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
        <div className="space-y-3">
            <MasterGenericList
                title="Database Abilità"
                items={items}
                loading={loading}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={handleDelete}
                columns={columns}
                filterConfig={filterConfig}
                sortLogic={(a, b) => (a.nome || "").localeCompare(b.nome || "")}
            />
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>{`Totale: ${totalCount}`}</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={loading || !hasPrev}
                        onClick={() => loadData(page - 1)}
                        className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500"
                    >
                        Precedente
                    </button>
                    <span>{`Pagina ${page}`}</span>
                    <button
                        type="button"
                        disabled={loading || !hasNext}
                        onClick={() => loadData(page + 1)}
                        className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40 hover:border-gray-500"
                    >
                        Successiva
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AbilitaList;