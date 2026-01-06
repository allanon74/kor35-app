import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffCreateCerimoniale, staffUpdateCerimoniale } from '../../api';
import CharacteristicInline from './inlines/CharacteristicInline';
import RichTextEditor from '../RichTextEditor';

const CerimonialeEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', testo: '', formula_attacco: '',
    aura_richiesta: null,
    durata_cerimoniale: '',
    num_partecipanti: 1,
    materiali: '',
    liv: 1,
    componenti: []
  });

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, [key]: newList });
  };

  const handleSave = async () => {
    try {
      const dataToSend = { 
        ...formData,
        aura_richiesta: formData.aura_richiesta?.id || formData.aura_richiesta || null
      };
      
      if (formData.id) await staffUpdateCerimoniale(formData.id, dataToSend, onLogout);
      else await staffCreateCerimoniale(dataToSend, onLogout);
      
      alert("Cerimoniale salvato!");
      onBack();
    } catch (e) {
      alert("Errore salvataggio: " + e.message);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[92vh] text-white border border-gray-700 shadow-2xl">
      
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-amber-400 uppercase tracking-tighter">
          {formData.id ? `Edit: ${formData.nome}` : 'Nuovo Cerimoniale'}
        </h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-2 rounded-lg font-black text-sm text-white transition-all">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm text-white transition-all">ANNULLA</button>
        </div>
      </div>

      <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-700/50 space-y-5 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
                label="Aura di Riferimento" 
                value={formData.aura_richiesta?.id || formData.aura_richiesta} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_richiesta: v ? parseInt(v, 10) : null})} 
            />
            <Input label="Formula / Effetto del Rito" value={formData.formula_attacco} onChange={v => setFormData({...formData, formula_attacco: v})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
                <Input label="Nome del Cerimoniale" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
            </div>
            <Input label="Livello" type="number" value={formData.liv} onChange={v => setFormData({...formData, liv: v})} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-900/10 p-5 rounded-xl border border-amber-500/20">
        <Input label="Tempo Esecuzione (es. 15 min)" value={formData.durata_cerimoniale} onChange={v => setFormData({...formData, durata_cerimoniale: v})} />
        <Input label="Partecipanti Minimi" type="number" value={formData.num_partecipanti} onChange={v => setFormData({...formData, num_partecipanti: v})} />
      </div>

      <RichTextEditor label="Materiali e Requisiti" value={formData.materiali} onChange={v => setFormData({...formData, materiali: v})} />
      <RichTextEditor label="Svolgimento e Testo" value={formData.testo} onChange={v => setFormData({...formData, testo: v})} />

      <CharacteristicInline 
        items={formData.componenti} 
        options={punteggiList.filter(p => p.tipo === 'CA')}
        onAdd={() => setFormData({...formData, componenti: [...formData.componenti, {caratteristica:'', valore:1}]})}
        onChange={(i, f, v) => updateInline('componenti', i, f, v)}
        onRemove={(i) => setFormData({...formData, componenti: formData.componenti.filter((_, idx) => idx !== i)})}
      />
    </div>
  );
};

// Helper locali...
const Input = ({ label, value, onChange, type="text" }) => (
    <div className="w-full text-left">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1 tracking-tighter">{label}</label>
      <input type={type} className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm text-white focus:border-amber-500 outline-none shadow-inner" value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
);

const Select = ({ label, value, options, onChange }) => (
    <div className="w-full text-left">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1 tracking-tighter">{label}</label>
      <select className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm text-white cursor-pointer focus:border-amber-500 outline-none" value={value ? String(value) : ""} onChange={e => onChange(e.target.value)}>
        <option value="">- SELEZIONA -</option>
        {options.map(o => <option key={o.id} value={String(o.id)}>{o.nome}</option>)}
      </select>
    </div>
);

export default CerimonialeEditor;