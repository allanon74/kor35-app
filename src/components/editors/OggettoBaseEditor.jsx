import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffUpdateOggettoBase, staffCreateOggettoBase, staffGetClassiOggetto } from '../../api';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';
import { ArrowLeft, Save } from 'lucide-react';

const TIPO_CHOICES = [
    {id:'FIS', nome:'Fisico'}, {id:'MAT', nome:'Materia'}, {id:'MOD', nome:'Mod'},
    {id:'INN', nome:'Innesto'}, {id:'MUT', nome:'Mutazione'}, {id:'AUM', nome:'Aumento'}, {id:'POT', nome:'Potenziamento'}
];

const OggettoBaseEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [classi, setClassi] = useState([]);
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', 
    descrizione: '', 
    tipo_oggetto: 'FIS', 
    classe_oggetto: null, 
    costo: 0, 
    is_tecnologico: false, 
    is_pesante: false, 
    attacco_base: '',
    in_vendita: true,
    statistiche_base: [], 
    statistiche_modificatori: []
  });

  useEffect(() => { staffGetClassiOggetto(onLogout).then(setClassi); }, []);

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    if (index === -1) {
        const exists = newList.find(it => (it.statistica?.id || it.statistica) === value.statId);
        if (!exists) {
            const newRecord = { statistica: value.statId };
            if (key === 'statistiche_base') {
                newRecord.valore_base = value.value;
            } else {
                newRecord.valore = value.value;
                newRecord.tipo_modificatore = 'ADD'; 
            }
            newList.push(newRecord);
        }
    } else {
        newList[index] = { ...newList[index], [field]: value };
    }
    setFormData({ ...formData, [key]: newList });
  };

  const handleSave = async () => {
    try {
        const getId = (item) => item?.id || item || null;
        const cleanStats = (list) => list.map(item => ({
             statistica: typeof item.statistica === 'object' ? item.statistica.id : item.statistica,
             valore_base: parseInt(item.valore_base || 0),
             valore: parseInt(item.valore || 0),
             tipo_modificatore: item.tipo_modificatore || 'ADD'
        })).filter(i => i.statistica);

        const data = { 
            ...formData, 
            classe_oggetto: getId(formData.classe_oggetto),
            statistiche_base: cleanStats(formData.statistiche_base),
            statistiche_modificatori: cleanStats(formData.statistiche_modificatori)
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
           <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg font-black text-sm shadow-lg transition-all flex items-center gap-2"><Save size={16}/> SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"><ArrowLeft size={16}/> ANNULLA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
        <div className="md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Nome Template</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none text-white" 
                value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        </div>
        
        <Select label="Tipo" value={formData.tipo_oggetto} options={TIPO_CHOICES} onChange={v => setFormData({...formData, tipo_oggetto: v})} />
        <Select label="Classe Oggetto" value={formData.classe_oggetto?.id || formData.classe_oggetto} options={classi} onChange={v => setFormData({...formData, classe_oggetto: v})} />

        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Costo (CR)</label>
            <input type="number" className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none text-white" 
                value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
        </div>

        {/* CAMPO AGGIUNTO: Attacco Base */}
        <div className="w-full">
            <label className="text-[10px] text-red-500 uppercase font-black block mb-1">Attacco Base (Formula)</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-red-500 outline-none text-red-300 font-mono" 
                placeholder="{stat} + X"
                value={formData.attacco_base || ''} onChange={e => setFormData({...formData, attacco_base: e.target.value})} />
        </div>
        
        <div className="md:col-span-2 flex items-center gap-6 pt-4 px-2">
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

        {/* CAMPO AGGIUNTO: Descrizione */}
        <div className="md:col-span-4 mt-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Descrizione Oggetto</label>
            <textarea 
                className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none text-gray-300 h-24 resize-none"
                value={formData.descrizione || ''} 
                onChange={e => setFormData({...formData, descrizione: e.target.value})} 
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatBaseInline 
            items={formData.statistiche_base} 
            options={punteggiList.filter(p => p.tipo === 'ST')} 
            onChange={(i, f, v) => updateInline('statistiche_base', i, f, v)}
          />
          
          <StatModInline 
            title="Modificatori (Bonus/Malus)" 
            items={formData.statistiche_modificatori} 
            options={punteggiList.filter(p => p.tipo === 'ST')} 
            auraOptions={punteggiList.filter(p => p.tipo === 'AU')} 
            elementOptions={punteggiList.filter(p => p.tipo === 'EL')}
            onAdd={() => setFormData({...formData, statistiche_modificatori: [...formData.statistiche_modificatori, {statistica:'', valore:0, tipo_modificatore:'ADD'}]})} 
            onChange={(i,f,v) => updateInline('statistiche_modificatori', i, f, v)}
            onRemove={i => setFormData({...formData, statistiche_modificatori: formData.statistiche_modificatori.filter((_,idx)=>idx!==i)})} 
          />
      </div>
    </div>
  );
};

export default OggettoBaseEditor;