import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffUpdateOggettoBase, staffCreateOggettoBase, staffGetClassiOggetto } from '../../api';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';

const TIPO_CHOICES = [
    {id:'FIS', nome:'Fisico'}, {id:'MAT', nome:'Materia'}, {id:'MOD', nome:'Mod'},
    {id:'INN', nome:'Innesto'}, {id:'MUT', nome:'Mutazione'}, {id:'AUM', nome:'Aumento'}, {id:'POT', nome:'Potenziamento'}
];

const OggettoBaseEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [classi, setClassi] = useState([]);
  
  // Correzione: initialData potrebbe avere 'cost' o 'costo' a seconda del backend
  // Uniformiamo tutto a 'costo' nel frontend
  const [formData, setFormData] = useState(initialData || {
    nome: '', descrizione: '', tipo_oggetto: 'FIS', classe_oggetto: null, 
    costo: 0, // Assicurati che questo campo corrisponda al modello (es. costo_crediti)
    is_tecnologico: false, is_pesante: false, attacco_base: '', in_vendita: true,
    statistiche_base: [], statistiche_modificatori: []
  });

  useEffect(() => { staffGetClassiOggetto(onLogout).then(setClassi); }, []);

  const handleSave = async () => {
    try {
        const getId = (item) => item?.id || item || null;

        // Funzione helper per pulire E rimuovere duplicati nelle liste
        const cleanAndDeduplicate = (list, keyField) => {
            const seen = new Set();
            return list
            .map(item => ({ ...item, [keyField]: getId(item[keyField]) })) // Estrae ID
            .filter(item => {
                const id = item[keyField];
                // Rimuove entry senza ID o duplicate
                if (!id || seen.has(id)) return false; 
                seen.add(id);
                return true;
            });
        };

        const data = { 
            ...formData, 
            classe_oggetto: getId(formData.classe_oggetto),
            // Pulizia delle liste nidificate
            statistiche_base: cleanAndDeduplicate(formData.statistiche_base, 'statistica'),
            statistiche_modificatori: cleanAndDeduplicate(formData.statistiche_modificatori, 'statistica')
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

  const Select = ({ label, value, options, onChange }) => (
    <div className="w-full">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <select className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm text-white focus:border-blue-500 outline-none" 
        value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">- SELEZIONA -</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nome || o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto border border-gray-700 shadow-2xl text-white overflow-y-auto max-h-[92vh]">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">
            {formData.id ? `Edit Template: ${formData.nome}` : 'Nuovo Oggetto Base'}
        </h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg font-black text-sm shadow-lg transition-all">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm transition-all">ANNULLA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
        <div className="md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Nome Template</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none" 
                value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        </div>
        
        <Select label="Tipo" value={formData.tipo_oggetto} options={TIPO_CHOICES} onChange={v => setFormData({...formData, tipo_oggetto: v})} />
        <Select label="Classe Oggetto" value={formData.classe_oggetto?.id || formData.classe_oggetto} options={classi} onChange={v => setFormData({...formData, classe_oggetto: v})} />

        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Costo (CR)</label>
            <input type="number" className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none" 
                value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
        </div>
        
        <div className="md:col-span-3 flex items-center gap-6 pt-4 px-2">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer hover:text-blue-300">
                <input type="checkbox" className="accent-blue-500" checked={formData.in_vendita} onChange={e => setFormData({...formData, in_vendita: e.target.checked})} /> 
                In Vendita (Shop)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer hover:text-red-300">
                <input type="checkbox" className="accent-red-500" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} /> 
                Pesante (OGP)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer hover:text-emerald-300">
                <input type="checkbox" className="accent-emerald-500" checked={formData.is_tecnologico} onChange={e => setFormData({...formData, is_tecnologico: e.target.checked})} /> 
                Tecnologico
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatBaseInline 
            title="Statistiche Base (Fisse)" 
            items={formData.statistiche_base} 
            options={punteggiList.filter(p => p.tipo === 'ST')} 
            onAdd={() => setFormData({...formData, statistiche_base: [...formData.statistiche_base, {statistica:'', valore_base:0}]})} 
            onChange={(i,f,v) => {const n=[...formData.statistiche_base]; n[i][f]=v; setFormData({...formData, statistiche_base:n});}} 
            onRemove={i => setFormData({...formData, statistiche_base: formData.statistiche_base.filter((_,idx)=>idx!==i)})} 
          />
          
          <StatModInline 
            title="Modificatori (Bonus/Malus)" 
            items={formData.statistiche_modificatori} 
            options={punteggiList.filter(p => p.tipo === 'ST')} 
            // CORREZIONE: Nomi props al singolare come richiesto dal componente
            auraOptions={punteggiList.filter(p => p.tipo === 'AU')} 
            elementOptions={punteggiList.filter(p => p.tipo === 'EL')}
            
            onAdd={() => setFormData({...formData, statistiche_modificatori: [...formData.statistiche_modificatori, {statistica:'', valore:0, tipo_modificatore:'ADD'}]})} 
            onChange={(i,f,v) => {const n=[...formData.statistiche_modificatori]; n[i][f]=v; setFormData({...formData, statistiche_modificatori:n});}} 
            onRemove={i => setFormData({...formData, statistiche_modificatori: formData.statistiche_modificatori.filter((_,idx)=>idx!==i)})} 
          />
      </div>
    </div>
  );
};

export default OggettoBaseEditor;