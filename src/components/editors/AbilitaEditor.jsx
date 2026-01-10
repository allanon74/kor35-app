import React, { useState, useEffect } from 'react';
import { staffCreateAbilita, staffUpdateAbilita, getPunteggiList, getAbilitaOptions, getTiersList } from '../../api';
import RichTextEditor from '../RichTextEditor';
import StatModInline from './inlines/StatModInline';
import GenericRelationInline from './inlines/GenericRelationInline';

const AbilitaEditor = ({ onBack, onLogout, initialData = null }) => {
    const [punteggi, setPunteggi] = useState([]); 
    const [abilitaList, setAbilitaList] = useState([]); 
    const [tiersList, setTiersList] = useState([]); 

    const [formData, setFormData] = useState(initialData || {
        nome: '',
        descrizione: '',
        caratteristica: null,
        costo_pc: 0,
        costo_crediti: 0,
        is_tratto_aura: false,
        aura_riferimento: null,
        livello_riferimento: 0,
        tiers: [], 
        requisiti: [], 
        punteggi_assegnati: [],
        prerequisiti: [], 
        statistiche: [] 
    });

    useEffect(() => {
        const loadResources = async () => {
            try {
                const [pts, abs, trs] = await Promise.all([
                    getPunteggiList(onLogout),
                    getAbilitaOptions(onLogout),
                    getTiersList(onLogout)
                ]);
                setPunteggi(pts || []);
                setAbilitaList(abs || []);
                setTiersList(trs || []);
            } catch (err) {
                console.error("Errore caricamento risorse editor", err);
            }
        };
        loadResources();
    }, [onLogout]);

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                caratteristica: formData.caratteristica ? parseInt(formData.caratteristica) : null,
                aura_riferimento: formData.aura_riferimento ? parseInt(formData.aura_riferimento) : null,
                tiers: formData.tiers.map(t => ({...t, tabella: parseInt(t.tabella)})),
                requisiti: formData.requisiti.map(r => ({...r, requisito: parseInt(r.requisito)})),
                punteggi_assegnati: formData.punteggi_assegnati.map(p => ({...p, punteggio: parseInt(p.punteggio)})),
                prerequisiti: formData.prerequisiti.map(p => ({...p, prerequisito: parseInt(p.prerequisito)})),
                // Statistiche è già gestito come array di oggetti da StatModInline
            };

            if (formData.id) {
                await staffUpdateAbilita(formData.id, payload, onLogout);
            } else {
                await staffCreateAbilita(payload, onLogout);
            }
            onBack(); 
        } catch (error) {
            alert("Errore durante il salvataggio: " + error.message);
        }
    };

    // Helper per StatModInline
    const handleUpdateStat = (index, field, value) => {
        const newStats = [...formData.statistiche];
        newStats[index] = { ...newStats[index], [field]: value };
        setFormData({ ...formData, statistiche: newStats });
    };

    const handleRemoveStat = (index) => {
        const newStats = formData.statistiche.filter((_, i) => i !== index);
        setFormData({ ...formData, statistiche: newStats });
    };

    const handleAddStat = () => {
        setFormData({
            ...formData,
            statistiche: [
                ...formData.statistiche,
                { statistica: null, valore: 1, tipo_modificatore: 'ADD' } // Default
            ]
        });
    };

    const caratteristiche = punteggi.filter(p => p.tipo === 'CA' || p.tipo === 'CO');
    const aure = punteggi.filter(p => p.tipo === 'AU');
    const allStats = punteggi.filter(p => p.tipo === 'ST');

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl text-white max-w-7xl mx-auto overflow-y-auto max-h-[90vh]">
            {/* HEADER EDITOR */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6 sticky top-0 bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-tighter">
                    {formData.id ? `Modifica: ${formData.nome}` : 'Nuova Abilità'}
                </h2>
                <div className="flex gap-3">
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-black text-sm shadow-lg">SALVA</button>
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold text-sm">ANNULLA</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLONNA 1: DATI BASE */}
                <div className="space-y-4 lg:col-span-1">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Nome</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white"
                            value={formData.nome}
                            onChange={e => setFormData({...formData, nome: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Carat. Base</label>
                            <select 
                                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white text-sm"
                                value={formData.caratteristica || ""}
                                onChange={e => setFormData({...formData, caratteristica: e.target.value})}
                            >
                                <option value="">- Nessuna -</option>
                                {caratteristiche.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Costo PC</label>
                            <input 
                                type="number" 
                                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white text-right"
                                value={formData.costo_pc}
                                onChange={e => setFormData({...formData, costo_pc: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Costo Crediti</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-white text-right"
                            value={formData.costo_crediti}
                            onChange={e => setFormData({...formData, costo_crediti: parseInt(e.target.value)})}
                        />
                    </div>

                    {/* BOX AURA */}
                    <div className="bg-gray-900/30 p-3 rounded border border-purple-900/30">
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.is_tratto_aura} 
                                onChange={e => setFormData({...formData, is_tratto_aura: e.target.checked})}
                            />
                            <span className="text-xs font-bold text-purple-400 uppercase">È un Tratto d'Aura</span>
                        </label>
                        
                        {formData.is_tratto_aura && (
                            <div className="space-y-2 pl-4 border-l-2 border-purple-500/30">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Aura Rif.</label>
                                    <select 
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm"
                                        value={formData.aura_riferimento || ""}
                                        onChange={e => setFormData({...formData, aura_riferimento: e.target.value})}
                                    >
                                        <option value="">- Seleziona -</option>
                                        {aure.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Livello Sblocco</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white"
                                        value={formData.livello_riferimento}
                                        onChange={e => setFormData({...formData, livello_riferimento: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNA 2: DESCRIZIONE */}
                <div className="lg:col-span-2 h-full flex flex-col">
                    <label className="text-xs text-gray-500 uppercase font-bold mb-1">Descrizione Effetto</label>
                    <div className="flex-1 bg-gray-950 border border-gray-700 rounded min-h-[200px]">
                        <RichTextEditor 
                            value={formData.descrizione || ''} 
                            onChange={(val) => setFormData({...formData, descrizione: val})} 
                        />
                    </div>
                </div>
            </div>

            {/* SEZIONE INLINES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                
                {/* 1. Tiers */}
                <GenericRelationInline 
                    title="Tiers (Livelli)"
                    items={formData.tiers}
                    options={tiersList}
                    targetKey="tabella"
                    valueKey="ordine"
                    onChange={list => setFormData({...formData, tiers: list})}
                    labelFinder={t => t.nome}
                />

                {/* 2. Requisiti */}
                <GenericRelationInline 
                    title="Requisiti Punteggi"
                    items={formData.requisiti}
                    options={punteggi}
                    targetKey="requisito"
                    valueKey="valore"
                    onChange={list => setFormData({...formData, requisiti: list})}
                />

                {/* 3. Prerequisiti */}
                <GenericRelationInline 
                    title="Prerequisiti (Abilità)"
                    items={formData.prerequisiti}
                    options={abilitaList.filter(a => a.id !== formData.id)}
                    targetKey="prerequisito"
                    valueKey={null}
                    onChange={list => setFormData({...formData, prerequisiti: list})}
                />

                {/* 4. Punteggi Assegnati */}
                <GenericRelationInline 
                    title="Assegna Punteggi (Bonus Fissi)"
                    items={formData.punteggi_assegnati}
                    options={punteggi.filter(p => p.tipo !== 'ST')}
                    targetKey="punteggio"
                    valueKey="valore"
                    onChange={list => setFormData({...formData, punteggi_assegnati: list})}
                />

                {/* 5. Statistiche (Inline Complessa) */}
                <div className="md:col-span-2 lg:col-span-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                        <h4 className="font-bold text-gray-300 uppercase text-xs">Modificatori Statistiche</h4>
                        <button onClick={handleAddStat} className="text-emerald-400 text-xs font-bold uppercase hover:text-emerald-300">
                            + Aggiungi
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {formData.statistiche.map((statItem, idx) => (
                            <StatModInline 
                                key={idx}
                                index={idx}
                                data={statItem}
                                onUpdate={handleUpdateStat}
                                onRemove={handleRemoveStat}
                                availableStats={allStats}
                            />
                        ))}
                        {formData.statistiche.length === 0 && <p className="text-gray-600 text-xs italic">Nessun modificatore statistica.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AbilitaEditor;