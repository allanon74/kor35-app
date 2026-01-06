import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { getStatisticheList, staffCreateTessitura, staffUpdateTessitura } from '../../api';
import CharacteristicInline from './inlines/CharacteristicInline';
import StatBaseInline from './inlines/StatBaseInline';
import RichTextEditor from '../RichTextEditor';

const TessituraEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [statsOptions, setStatsOptions] = useState([]);
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', testo: '', formula_attacco: '',
    livello: 1,
    componenti: [],
    statistiche_base: []
  });

  useEffect(() => {
    getStatisticheList(onLogout).then(setStatsOptions);
  }, [onLogout]);

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    if (index === -1 && key === 'statistiche_base') {
      const exists = newList.find(it => (it.statistica?.id || it.statistica) === value.statId);
      if (!exists) newList.push({ statistica: value.statId, valore_base: value.value });
    } else {
      newList[index] = { ...newList[index], [field]: value };
    }
    setFormData({ ...formData, [key]: newList });
  };

  const handleSave = async () => {
    try {
      const dataToSend = { 
        ...formData,
        statistiche_base: formData.statistiche_base.map(sb => ({
          ...sb,
          statistica: sb.statistica?.id || sb.statistica,
          id: undefined // Pulizia per update annidato
        }))
      };
      
      if (formData.id) await staffUpdateTessitura(formData.id, dataToSend, onLogout);
      else await staffCreateTessitura(dataToSend, onLogout);
      
      alert("Tessitura salvata!");
      onBack();
    } catch (e) {
      alert("Errore salvataggio: " + e.message);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[92vh] text-white border border-gray-700 shadow-2xl">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-tighter">
          {formData.id ? `Edit: ${formData.nome}` : 'Nuova Tessitura'}
        </h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-2 rounded-lg font-black text-sm text-white transition-all">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm text-white transition-all">ANNULLA</button>
        </div>
      </div>

      <div className="bg-gray-900/40 p-5 rounded-xl border border-gray-700/50 space-y-5">
        <div className="bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/20">
            <Input label="Formula Attacco / Effetto" placeholder="es. @vol + 2d10" value={formData.formula_attacco} onChange={v => setFormData({...formData, formula_attacco: v})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Input label="Nome Tessitura" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
          </div>
          <Input label="Livello" type="number" value={formData.livello} onChange={v => setFormData({...formData, livello: v})} />
        </div>
      </div>

      <RichTextEditor label="Descrizione Tecnica" value={formData.testo} onChange={v => setFormData({...formData, testo: v})} />

      <CharacteristicInline 
        items={formData.componenti} 
        options={punteggiList.filter(p => p.tipo === 'CA')}
        onAdd={() => setFormData({...formData, componenti: [...formData.componenti, {caratteristica:'', valore:1}]})}
        onChange={(i, f, v) => updateInline('componenti', i, f, v)}
        onRemove={(i) => setFormData({...formData, componenti: formData.componenti.filter((_, idx) => idx !== i)})}
      />

      <StatBaseInline 
        items={formData.statistiche_base} 
        options={statsOptions} 
        onChange={(i, f, v) => updateInline('statistiche_base', i, f, v)} 
      />
    </div>
  );
};

const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div className="w-full text-left">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1 tracking-tighter">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm text-white focus:border-cyan-500 outline-none shadow-inner" value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
);

export default TessituraEditor;