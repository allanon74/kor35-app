import React, { useState, useEffect } from 'react';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import TabellaList from './TabellaList';
import TabellaEditor from './TabellaEditor';
import { getTiers, createTier, updateTier, deleteTier, updateTierAbilita } from '../../api';

const TabellaManager = ({ onLogout }) => {
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTier, setCurrentTier] = useState(null);
    const token = localStorage.getItem('access_token');

    const fetchTiers = async () => {
        setIsLoading(true);
        try {
            const data = await getTiers(token);
            setTiers(data);
        } catch (error) {
            console.error("Errore fetch tiers", error);
            if (error.status === 401) onLogout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    const handleCreate = () => {
        setCurrentTier(null);
        setIsEditing(true);
    };

    const handleEdit = (tier) => {
        setCurrentTier(tier);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa tabella?")) return;
        try {
            await deleteTier(id, token);
            setTiers(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            alert("Errore durante l'eliminazione");
        }
    };

    const handleSave = async (formData, connectedSkills) => {
        try {
            let savedTier;
            if (currentTier) {
                // Update Base Info
                savedTier = await updateTier(currentTier.id, formData, token);
                // Update Skills Relation
                await updateTierAbilita(currentTier.id, connectedSkills, token);
            } else {
                // Create
                savedTier = await createTier(formData, token);
                // Update Skills Relation (ora che abbiamo l'ID)
                await updateTierAbilita(savedTier.id, connectedSkills, token);
            }
            
            setIsEditing(false);
            fetchTiers(); // Ricarica per avere i dati aggiornati
        } catch (error) {
            console.error("Errore salvataggio", error);
            alert("Errore durante il salvataggio: " + error.message);
        }
    };

    if (isEditing) {
        return (
            <div className="h-full p-4 animate-in fade-in slide-in-from-bottom-4">
                <TabellaEditor 
                    tier={currentTier} 
                    onSave={handleSave} 
                    onCancel={() => setIsEditing(false)} 
                    token={token}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-gray-100 uppercase tracking-wide">Gestione Tabelle (Tier)</h2>
                    <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-mono">{tiers.length}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchTiers} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Aggiorna"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={handleCreate} 
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
                    >
                        <Plus size={20} /> Nuova Tabella
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={40} className="text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <TabellaList 
                        tiers={tiers} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                )}
            </div>
        </div>
    );
};

export default TabellaManager;