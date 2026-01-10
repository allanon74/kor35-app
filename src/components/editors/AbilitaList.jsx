import React from 'react';
import { staffGetAbilitaList, staffDeleteAbilita } from '../../api';
import MasterGenericList from './MasterGenericList';

const AbilitaList = ({ onAdd, onEdit, onLogout }) => {
    
    const columns = [
        { key: 'nome', label: 'Nome' },
        { key: 'costo_pc', label: 'Costo PC' },
        { key: 'costo_crediti', label: 'Crediti' }, // Nota: Assicurati che il backend ritorni 'costo_crediti' o 'costo'
        { 
            key: 'tipo', 
            label: 'Tipo', 
            render: (row) => row.is_tratto_aura ? 
                <span className="text-purple-400 text-xs font-bold px-2 py-0.5 bg-purple-900/50 rounded border border-purple-500/30">AURA</span> : 
                <span className="text-gray-400 text-xs">-</span> 
        }
    ];

    return (
        <MasterGenericList
            title="Database Abilità"
            fetchData={staffGetAbilitaList}
            deleteItem={staffDeleteAbilita}
            columns={columns}
            onAdd={onAdd}
            onEdit={onEdit}
            onLogout={onLogout}
        />
    );
};

export default AbilitaList;