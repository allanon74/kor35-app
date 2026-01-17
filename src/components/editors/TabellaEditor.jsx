import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import RichTextEditor from '../RichTextEditor'; 
import { getAllAbilitaSimple } from '../../api'; // Assicurati che il path sia corretto

const TabellaEditor = ({ tier, onSave, onCancel, token }) => {
    // Stato form principale
    const [formData, setFormData] = useState({
        nome: tier?.nome || '',
        tipo: tier?.tipo || 'Classe',
        descrizione: tier?.descrizione || '',
    });

    // Stato gestione abilità collegate
    const [connectedSkills, setConnectedSkills] = useState(
        tier?.abilita_collegate?.map(a => ({
            abilita_id: a.abilita_id,
            nome: a.abilita_nome,
            ordine: a.ordine
        })) || []
    );

    // Stato gestione ricerca/aggiunta abilità
    const [allAbilities, setAllAbilities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAbilityId, setSelectedAbilityId] = useState('');
    const [newOrder, setNewOrder] = useState(0);

    // Carica lista completa abilità per la combo
    useEffect(() => {
        const loadAbilities = async () => {
            try {
                // CORRETTO: Chiamata con onLogout
                const data = await getAllAbilitaSimple(onLogout);
                setAllAbilities(data);
                
                // ... logica ordine ...
            } catch (error) {
                console.error("Errore caricamento abilità", error);
            }
        };
        loadAbilities();
    }, []);

    // Filtra abilità nella combo
    const filteredAbilities = allAbilities.filter(a => 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !connectedSkills.some(cs => cs.abilita_id === a.id) // Escludi quelle già aggiunte
    );

    const handleAddSkill = () => {
        if (!selectedAbilityId) return;
        const abilityToAdd = allAbilities.find(a => a.id === parseInt(selectedAbilityId));
        
        setConnectedSkills(prev => [...prev, {
            abilita_id: abilityToAdd.id,
            nome: abilityToAdd.nome,
            ordine: parseInt(newOrder)
        }].sort((a,b) => a.ordine - b.ordine));

        setSelectedAbilityId('');
        setNewOrder(parseInt(newOrder) + 1);
        setSearchTerm('');
    };

    const handleRemoveSkill = (id) => {
        setConnectedSkills(prev => prev.filter(s => s.abilita_id !== id));
    };

    const handleOrderChange = (index, delta) => {
        // Funzione opzionale per spostare su/giù visivamente (aggiorna il campo ordine)
        // Per ora semplice input numerico nella lista è più flessibile
    };
    
    const handleSkillOrderEdit = (idx, val) => {
        const newSkills = [...connectedSkills];
        newSkills[idx].ordine = parseInt(val);
        // Ordina automaticamente
        newSkills.sort((a,b) => a.ordine - b.ordine);
        setConnectedSkills(newSkills);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Passiamo dati del tier + lista abilità formattata
        onSave(formData, connectedSkills);
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-full overflow-hidden">
            {/* Header Editor */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {tier ? 'Modifica Tabella' : 'Nuova Tabella'}
                </h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* --- DATI PRINCIPALI --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Tabella</label>
                        <input 
                            type="text" 
                            value={formData.nome}
                            onChange={e => setFormData({...formData, nome: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo (es. Classe, Razza)</label>
                        <input 
                            type="text" 
                            value={formData.tipo}
                            onChange={e => setFormData({...formData, tipo: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 focus:outline-none"
                            list="tipi-list"
                        />
                        <datalist id="tipi-list">
                            <option value="Classe" />
                            <option value="Razza" />
                            <option value="Specializzazione" />
                        </datalist>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrizione</label>
                    <div className="bg-gray-900 rounded-lg border border-gray-600 overflow-hidden text-black">
                        <RichTextEditor 
                            value={formData.descrizione} 
                            onChange={(val) => setFormData({...formData, descrizione: val})} 
                        />
                    </div>
                </div>

                <div className="border-t border-gray-700 my-4 pt-4"></div>

                {/* --- GESTIONE ABILITÀ --- */}
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                    <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
                        <Layers size={20}/> Abilità nel Tier
                    </h3>

                    {/* Form Aggiunta Abilità */}
                    <div className="flex flex-col md:flex-row gap-2 mb-6 items-end">
                        <div className="flex-1 relative">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cerca Abilità</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-gray-500 pointer-events-none"/>
                                <input 
                                    type="text"
                                    placeholder="Filtra..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-2 py-2 bg-gray-800 border border-gray-600 rounded-t text-sm focus:outline-none"
                                />
                            </div>
                            <select 
                                value={selectedAbilityId}
                                onChange={e => setSelectedAbilityId(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-t-0 border-gray-600 rounded-b text-sm focus:outline-none text-white appearance-none"
                                size={5} // Mostra come lista aperta
                            >
                                {filteredAbilities.map(a => (
                                    <option key={a.id} value={a.id} className="p-1 hover:bg-indigo-600 cursor-pointer">
                                        {a.nome}
                                    </option>
                                ))}
                                {filteredAbilities.length === 0 && <option disabled>Nessuna abilità trovata</option>}
                            </select>
                        </div>
                        
                        <div className="w-24">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ordine</label>
                            <input 
                                type="number" 
                                value={newOrder}
                                onChange={e => setNewOrder(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-center"
                            />
                        </div>

                        <button 
                            type="button"
                            onClick={handleAddSkill}
                            disabled={!selectedAbilityId}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2.5 rounded shadow flex items-center gap-2 font-bold mb-0.5"
                        >
                            <Plus size={20}/> Aggiungi
                        </button>
                    </div>

                    {/* Lista Abilità Aggiunte */}
                    <div className="space-y-2">
                        {connectedSkills.length === 0 && (
                            <p className="text-gray-500 text-center text-sm italic py-4">Nessuna abilità collegata</p>
                        )}
                        {connectedSkills.map((skill, idx) => (
                            <div key={skill.abilita_id} className="flex items-center gap-3 bg-gray-800 p-2 rounded border border-gray-700 animate-in fade-in slide-in-from-left-2">
                                <div className="bg-gray-900 text-gray-400 font-mono text-xs w-8 h-8 flex items-center justify-center rounded border border-gray-700">
                                    {idx + 1}
                                </div>
                                
                                <span className="flex-1 font-bold text-gray-200">{skill.nome}</span>
                                
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-gray-500 uppercase mr-1">Ord.</label>
                                    <input 
                                        type="number" 
                                        value={skill.ordine}
                                        onChange={(e) => handleSkillOrderEdit(idx, e.target.value)}
                                        className="w-16 bg-gray-900 border border-gray-600 rounded px-1 py-1 text-center text-sm"
                                    />
                                </div>

                                <button 
                                    onClick={() => handleRemoveSkill(skill.abilita_id)}
                                    className="text-red-500 hover:bg-red-900/30 p-1.5 rounded transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-300 hover:text-white font-bold transition-colors"
                >
                    Annulla
                </button>
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg font-bold flex items-center gap-2"
                >
                    <Save size={18} /> Salva Tabella
                </button>
            </div>
        </div>
    );
};

export default TabellaEditor;