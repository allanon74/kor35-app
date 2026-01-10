import React, { useState, useEffect } from 'react';
import { staffCreateAbilita, staffUpdateAbilita, getPunteggiList, getAbilitaOptions, getTiersList } from '../../api';
import RichTextEditor from '../RichTextEditor';
import StatModInline from './inlines/StatModInline'; // Riutilizziamo quello esistente
import GenericRelationInline from './inlines/GenericRelationInline';

const AbilitaEditor = ({ onBack, onLogout, initialData = null }) => {
    // Stati per i dati di lookup
    const [punteggi, setPunteggi] = useState([]); // Per Caratteristiche e Requisiti
    const [abilitaList, setAbilitaList] = useState([]); // Per Prerequisiti
    const [tiersList, setTiersList] = useState([]); // Per Tiers

    // Form Data
    const [formData, setFormData] = useState(initialData || {
        nome: '',
        descrizione: '',
        caratteristica: null,
        costo_pc: 0,
        costo_crediti: 0,
        is_tratto_aura: false,
        aura_riferimento: null,
        livello_riferimento: 0,
        
        // Inlines
        tiers: [], // { tabella: id, costo: int, ordine: int }
        requisiti: [], // { requisito: id, valore: int }
        punteggi_assegnati: [], // { punteggio: id, valore: int }
        prerequisiti: [], // { prerequisito: id }
        statistiche: [] // { statistica: id, valore: int, tipo_modificatore: 'ADD' ... }
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

    // Helpers per Inlines
    const handleStatChange = (newList) => {
        // Mappa il formato di StatModInline a quello del Serializer AbilitaStatistica
        // StatModInline ritorna { statId, value, ... } -> Noi vogliamo { statistica: statId, valore: value }
        // NOTA: Se StatModInline è già coerente con gli altri editor, adattiamo qui i dati
        // Assumendo che StatModInline ritorni una lista di oggetti pronti
        setFormData({ ...formData, statistiche: newList });
    };

    const handleSave = async () => {
        try {
            // Pulizia e preparazione dati
            const payload = {
                ...formData,
                caratteristica: formData.caratteristica ? parseInt(formData.caratteristica) : null,
                aura_riferimento: formData.aura_riferimento ? parseInt(formData.aura_riferimento) : null,
                
                // Assicuriamoci che gli ID siano interi per le FK
                tiers: formData.tiers.map(t => ({...t, tabella: parseInt(t.tabella)})),
                requisiti: formData.requisiti.map(r => ({...r, requisito: parseInt(r.requisito)})),
                punteggi_assegnati: formData.punteggi_assegnati.map(p => ({...p, punteggio: parseInt(p.punteggio)})),
                prerequisiti: formData.prerequisiti.map(p => ({...p, prerequisito: parseInt(p.prerequisito)})),
            };

            if (formData.id) {
                await staffUpdateAbilita(formData.id, payload, onLogout);
            } else {
                await staffCreateAbilita(payload, onLogout);
            }
            onBack(); // Torna alla lista
        } catch (error) {
            alert("Errore durante il salvataggio: " + error.message);
        }
    };

    // Filtri per dropdown
    const caratteristiche = punteggi.filter(p => p.tipo === 'CA' || p.tipo === 'CO'); // Caratteristiche e Condizioni
    const aure = punteggi.filter(p => p.tipo === 'AU');

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl text-white max-w-7xl mx-auto overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-tighter">
                    {formData.id ? `Modifica: ${formData.nome}` : 'Nuova Abilità'}
                </h2>
                <div className="flex gap-3">
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-black text-sm">SALVA</button>
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold text-sm">ANNULLA</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLONNA 1: Dati Base */}
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
                            <label className="text-xs text-gray-500 uppercase font-bold">Caratteristica Base</label>
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
                                    <label className="text-xs text-gray-500 uppercase font-bold">Aura Riferimento</label>
                                    <select 
                                        className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm"
                                        value={formData.aura_riferimento || ""}
                                        onChange={e => setFormData({...formData, aura_riferimento: e.target.value})}
                                    >
                                        <option value="">- Seleziona Aura -</option>
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

                {/* COLONNA 2: Descrizione */}
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

            {/* ZONA INLINES (TABELLE RELAZIONI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                
                {/* 1. Tiers (Specifico per Tabella Costi) */}
                <GenericRelationInline 
                    title="Tiers & Costi"
                    items={formData.tiers}
                    options={tiersList} // Tiers dal DB
                    targetKey="tabella"
                    valueKey="costo" // Usiamo 'costo' invece di valore
                    onChange={list => setFormData({...formData, tiers: list})}
                    labelFinder={t => t.nome}
                />

                {/* 2. Requisiti (Punteggi necessari) */}
                <GenericRelationInline 
                    title="Requisiti Punteggi"
                    items={formData.requisiti}
                    options={punteggi}
                    targetKey="requisito"
                    valueKey="valore"
                    onChange={list => setFormData({...formData, requisiti: list})}
                />

                {/* 3. Prerequisiti (Altre Abilità) */}
                <GenericRelationInline 
                    title="Prerequisiti (Altre Abilità)"
                    items={formData.prerequisiti}
                    options={abilitaList.filter(a => a.id !== formData.id)} // Escludi se stessa
                    targetKey="prerequisito"
                    valueKey={null} // Non c'è valore numerico
                    onChange={list => setFormData({...formData, prerequisiti: list})}
                />

                {/* 4. Punteggi Assegnati (Bonus) */}
                <GenericRelationInline 
                    title="Assegna Punteggi (Bonus Fissi)"
                    items={formData.punteggi_assegnati}
                    options={punteggi.filter(p => p.tipo !== 'ST')} // Escludi statistiche qui
                    targetKey="punteggio"
                    valueKey="valore"
                    onChange={list => setFormData({...formData, punteggi_assegnati: list})}
                />

                {/* 5. Statistiche (Inline Complesso) */}
                <div className="md:col-span-2 lg:col-span-3">
                    <h4 className="font-bold text-gray-300 uppercase text-xs mb-2 border-b border-gray-700 pb-1">Modificatori Statistiche</h4>
                    {/* Nota: StatModInline esistente si aspetta 'statistiche' come array nel padre o props specifiche.
                        Qui adattiamo usando un wrapper manuale o un map se il componente StatModInline non supporta il passaggio diretto.
                        Assumendo di dover usare una logica simile a OggettoEditor per StatModInline: */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        {/* Utilizzo semplificato: creiamo righe per ogni statistica */}
                        {formData.statistiche.map((statItem, idx) => (
                            <StatModInline 
                                key={idx}
                                index={idx}
                                data={statItem}
                                // Passiamo funzioni fittizie o reali per update
                                onUpdate={(idx, field, val) => {
                                    const newStats = [...formData.statistiche];
                                    newStats[idx] = { ...newStats[idx], [field]: val };
                                    setFormData({...formData, statistiche: newStats});
                                }}
                                onRemove={() => {
                                    const newStats = formData.statistiche.filter((_, i) => i !== idx);
                                    setFormData({...formData, statistiche: newStats});
                                }}
                                // Se StatModInline richiede la lista completa di opzioni stat
                                availableStats={punteggi.filter(p => p.tipo === 'ST')}
                            />
                        ))}
                        <button 
                            onClick={() => setFormData({
                                ...formData, 
                                statistiche: [...formData.statistiche, { statistica: null, valore: 1, tipo_modificatore: 'ADD' }]
                            })}
                            className="mt-2 text-emerald-400 text-xs font-bold uppercase hover:text-emerald-300 flex items-center gap-1"
                        >
                            + Aggiungi Modificatore Statistica
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AbilitaEditor;