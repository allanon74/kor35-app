import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffUpdateOggetto, staffCreateOggetto, staffGetClassiOggetto } from '../../api';
import CharacteristicInline from './inlines/CharacteristicInline';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';
import RichTextEditor from '../RichTextEditor';

const TIPO_CHOICES = [
    {id:'FIS', nome:'Fisico'}, {id:'MAT', nome:'Materia'}, {id:'MOD', nome:'Mod'},
    {id:'INN', nome:'Innesto'}, {id:'MUT', nome:'Mutazione'}, {id:'AUM', nome:'Aumento'}, {id:'POT', nome:'Potenziamento'}
];

const OggettoEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [classi, setClassi] = useState([]);
  const [formData, setFormData] = useState(initialData || {
    nome: '', testo: '', tipo_oggetto: 'FIS', aura: null, classe_oggetto: null,
    is_tecnologico: false, is_equipaggiato: false, is_pesante: false,
    attacco_base: '', componenti: [], statistiche_base: [], statistiche: []
  });

  useEffect(() => { staffGetClassiOggetto(onLogout).then(setClassi); }, []);

  const handleSave = async () => {
    try {
      const data = { ...formData, aura: formData.aura?.id || formData.aura || null, classe_oggetto: formData.classe_oggetto?.id || formData.classe_oggetto || null };
      if (formData.id) await staffUpdateOggetto(formData.id, data, onLogout);
      else await staffCreateOggetto(data, onLogout);
      alert("Salvato!"); onBack();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[92vh] border border-gray-700 shadow-2xl text-white">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-tighter">{formData.id ? `Edit: ${formData.nome}` : 'Nuovo Oggetto'}</h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-2 rounded-lg font-black text-sm">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm">ANNULLA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-xl">
        <div className="md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Nome</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        </div>
        <Select label="Tipo" value={formData.tipo_oggetto} options={TIPO_CHOICES} onChange={v => setFormData({...formData, tipo_oggetto: v})} />
        <Select label="Aura" value={formData.aura?.id || formData.aura} options={punteggiList.filter(p => p.tipo === 'AU')} onChange={v => setFormData({...formData, aura: v})} />
        <Select label="Classe" value={formData.classe_oggetto?.id || formData.classe_oggetto} options={classi} onChange={v => setFormData({...formData, classe_oggetto: v})} />
        <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.is_tecnologico} onChange={e => setFormData({...formData, is_tecnologico: e.target.checked})} /> Tecnologico</label>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} /> Pesante (OGP)</label>
        </div>
        <div className="md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Formula Attacco</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm font-mono" value={formData.attacco_base} onChange={e => setFormData({...formData, attacco_base: e.target.value})} />
        </div>
      </div>

      <RichTextEditor label="Descrizione Narrativa" value={formData.testo} onChange={v => setFormData({...formData, testo: v})} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatBaseInline 
            items={formData.statistiche_base} 
            options={punteggiList.filter(p => p.tipo === 'ST')} 
            onAdd={() => setFormData({...formData, statistiche_base: [...formData.statistiche_base, {statistica:'', valore_base:0}]})} 
            onChange={(i, f, v) => {
                if (i === -1) {
                // Gestione nuovo record: v contiene { statId: ..., value: ... }
                const newRecord = { statistica: v.statId, valore_base: v.value };
                setFormData({
                    ...formData,
                    statistiche_base: [...formData.statistiche_base, newRecord]
                });
                } else {
                // Modifica record esistente
                const n = [...formData.statistiche_base];
                n[i][f] = v;
                setFormData({ ...formData, statistiche_base: n });
                }
            }} 
            onRemove={i => setFormData({...formData, statistiche_base: formData.statistiche_base.filter((_,idx)=>idx!==i)})} 
          />
          <StatModInline items={formData.statistiche} options={punteggiList.filter(p => p.tipo === 'ST')} aurasOptions={punteggiList.filter(p => p.tipo === 'AU')} elementsOptions={punteggiList.filter(p => p.tipo === 'EL')} onAdd={() => setFormData({...formData, statistiche: [...formData.statistiche, {statistica:'', valore:0, tipo_modificatore:'ADD'}]})} onChange={(i,f,v) => {const n=[...formData.statistiche]; n[i][f]=v; setFormData({...formData, statistiche:n});}} onRemove={i => setFormData({...formData, statistiche: formData.statistiche.filter((_,idx)=>idx!==i)})} />
      </div>

      <CharacteristicInline items={formData.componenti} options={punteggiList.filter(p => p.tipo === 'CA')} onAdd={() => setFormData({...formData, componenti: [...formData.componenti, {caratteristica:'', valore:1}]})} onChange={(i,f,v) => {const n=[...formData.componenti]; n[i][f]=v; setFormData({...formData, componenti:n});}} onRemove={i => setFormData({...formData, componenti: formData.componenti.filter((_,idx)=>idx!==i)})} />
    </div>
  );
};

const Select = ({ label, value, options, onChange }) => (
    <div className="w-full">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <select className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm text-white cursor-pointer" value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">- SELEZIONA -</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nome || o.label}</option>)}
      </select>
    </div>
);

export default OggettoEditor;