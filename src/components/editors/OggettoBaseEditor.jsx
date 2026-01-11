import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffUpdateOggettoBase, staffCreateOggettoBase, staffGetClassiOggetto } from '../../api';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';
import { Save, ArrowLeft } from 'lucide-react'; // Assicurati di avere queste icone

const TIPO_CHOICES = [
    {id:'FIS', nome:'Fisico'}, {id:'MAT', nome:'Materia'}, {id:'MOD', nome:'Mod'},
    {id:'INN', nome:'Innesto'}, {id:'MUT', nome:'Mutazione'}, {id:'AUM', nome:'Aumento'}, {id:'POT', nome:'Potenziamento'}
];

const OggettoBaseEditor = ({ onBack, onLogout, initialData = null }) => {
  const [classi, setClassi] = useState([]);
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', 
    descrizione: '', // Campo mancante aggiunto
    tipo_oggetto: 'FIS', 
    classe_oggetto: null, 
    costo: 0, 
    is_tecnologico: false, 
    is_pesante: false, 
    attacco_base: '', // Campo mancante aggiunto
    in_vendita: true,
    statistiche_base: [], 
    statistiche_modificatori: []
  });

  useEffect(() => { staffGetClassiOggetto(onLogout).then(setClassi); }, []);

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    if (index === -1) {
        // Logica creazione nuova riga da Inline
        const statId = value.statId; 
        const exists = newList.find(it => (it.statistica?.id || it.statistica) === statId);
        
        if (!exists) {
            const newRecord = { statistica: statId }; // Salviamo l'ID
            if (key === 'statistiche_base') {
                newRecord.valore_base = value.value;
            } else {
                newRecord.valore = value.value;
                newRecord.tipo_modificatore = 'ADD'; 
            }
            newList.push(newRecord);
        }
    } else {
        // Aggiornamento riga esistente
        newList[index] = { ...newList[index], [field]: value };
    }
    setFormData({ ...formData, [key]: newList });
  };

  const handleSave = async () => {
    try {
        const getId = (item) => item?.id || item || null;
        
        // Funzione per pulire le liste statistiche prima dell'invio
        const prepareStats = (list) => {
            return list.map(item => ({
                // Se item.statistica è un oggetto (es. load iniziale), prendi ID. Altrimenti usa il valore (ID)
                statistica: typeof item.statistica === 'object' ? item.statistica.id : item.statistica,
                valore_base: parseInt(item.valore_base || 0),
                valore: parseInt(item.valore || 0), // Solo per modificatori
                tipo_modificatore: item.tipo_modificatore || 'ADD' // Solo per modificatori
            })).filter(item => item.statistica); // Rimuove voci senza ID stat
        };

        const data = { 
            ...formData, 
            classe_oggetto: getId(formData.classe_oggetto),
            statistiche_base: prepareStats(formData.statistiche_base),
            statistiche_modificatori: prepareStats(formData.statistiche_modificatori)
        };

        if (formData.id) await staffUpdateOggettoBase(formData.id, data, onLogout);
        else await staffCreateOggettoBase(data, onLogout);
        
        alert("Salvato correttamente!");
        onBack();
    } catch (e) { 
        console.error(e);
        alert("Errore salvataggio: " + (e.message || "Controlla i dati.")); 
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto border border-gray-700 shadow-2xl text-white overflow-y-auto h-full">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-black uppercase text-white">Editor Oggetto Base</h2>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20}/> Indietro
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonna 1: Dati Base */}
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Oggetto</label>
                    <input className="w-full bg-gray-900 p-3 rounded border border-gray-700 focus:border-indigo-500 outline-none font-bold text-white"
                        value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
                    <select className="w-full bg-gray-900 p-3 rounded border border-gray-700 focus:border-indigo-500 outline-none text-white"
                        value={formData.tipo_oggetto} onChange={e => setFormData({...formData, tipo_oggetto: e.target.value})}>
                        {TIPO_CHOICES.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Classe (Es. Fucile, Spada)</label>
                    <select className="w-full bg-gray-900 p-3 rounded border border-gray-700 focus:border-indigo-500 outline-none text-white"
                        value={formData.classe_oggetto?.id || formData.classe_oggetto || ''} onChange={e => setFormData({...formData, classe_oggetto: e.target.value})}>
                        <option value="">- Nessuna -</option>
                        {classi.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Costo (CR)</label>
                        <input type="number" className="w-full bg-gray-900 p-3 rounded border border-gray-700 text-amber-400 font-mono"
                            value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" checked={formData.in_vendita} onChange={e => setFormData({...formData, in_vendita: e.target.checked})} />
                        <span className="text-xs uppercase font-bold text-gray-400">In Vendita</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-900 p-2 rounded border border-gray-700 flex-1">
                        <input type="checkbox" checked={formData.is_tecnologico} onChange={e => setFormData({...formData, is_tecnologico: e.target.checked})} />
                        <span className="text-xs uppercase font-bold text-cyan-400">Tecnologico</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-900 p-2 rounded border border-gray-700 flex-1">
                        <input type="checkbox" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} />
                        <span className="text-xs uppercase font-bold text-red-400">Pesante (OGP)</span>
                    </label>
                </div>
            </div>

            {/* Colonna 2: Descrizioni e Attacco */}
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Formula Attacco Base</label>
                    <input className="w-full bg-gray-900 p-3 rounded border border-gray-700 focus:border-red-500 outline-none text-red-300 font-mono text-sm"
                        placeholder="Es. {forza} Danni..."
                        value={formData.attacco_base || ''} onChange={e => setFormData({...formData, attacco_base: e.target.value})} />
                    <p className="text-[9px] text-gray-600 mt-1">Usa le graffe per le variabili. Es: &#123;rango|:RANGO&#125;</p>
                </div>

                <div className="h-full flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Descrizione</label>
                    <textarea className="flex-1 w-full bg-gray-900 p-3 rounded border border-gray-700 focus:border-indigo-500 outline-none text-gray-300 text-sm resize-none min-h-[150px]"
                        value={formData.descrizione || ''} onChange={e => setFormData({...formData, descrizione: e.target.value})} />
                </div>
            </div>

            {/* Colonna 3: Statistiche */}
            <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
                <StatBaseInline 
                    items={formData.statistiche_base} 
                    // Assicurati che useCharacter fornisca 'punteggiList' con le 'statistiche'
                    options={useCharacter().punteggiList?.filter(p => p.tipo === 'ST') || []} 
                    onChange={(idx, field, val) => updateInline('statistiche_base', idx, field, val)} 
                />
                
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-xs font-black uppercase text-indigo-400 mb-2">Modificatori Applicati (Equip)</h3>
                    <StatModInline
                        items={formData.statistiche_modificatori}
                        options={useCharacter().punteggiList?.filter(p => p.tipo === 'ST') || []}
                        onChange={(idx, field, val) => updateInline('statistiche_modificatori', idx, field, val)}
                    />
                </div>
            </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
            <Save size={24}/> Salva Oggetto Base
        </button>
    </div>
  );
};

export default OggettoBaseEditor;