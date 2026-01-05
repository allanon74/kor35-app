import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { getStatisticheList, staffCreateInfusione, staffUpdateInfusione } from '../../api';

const InfusioneEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter(); // Recuperiamo le Aure e Caratt. dal contesto
  const [statsOptions, setStatsOptions] = useState([]);
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', testo: '', formula_attacco: '',
    aura_richiesta: '', aura_infusione: '',
    componenti: [],          // Inlines: {caratteristica, valore}
    statistiche_base: [],    // Inlines: {statistica, valore_base}
    modificatori: []         // Inlines: {statistica, valore, tipo_modificatore: 'ADD'}
  });

  useEffect(() => {
    getStatisticheList(onLogout).then(setStatsOptions).catch(console.error);
  }, [onLogout]);

  // Gestione dinamica Inlines
  const addInline = (key, defaultObj) => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], defaultObj] }));
  };

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    newList[index][field] = value;
    setFormData({ ...formData, [key]: newList });
  };

  const removeInline = (key, index) => {
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    try {
      if (formData.id) await staffUpdateInfusione(formData.id, formData, onLogout);
      else await staffCreateInfusione(formData, onLogout);
      alert("Salvato con successo!");
      onBack();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
        <Select label="Aura Richiesta" value={formData.aura_richiesta} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_richiesta: v})} />
      </div>

      <textarea className="w-full bg-gray-900 p-3 rounded border border-gray-700" rows="3" 
                placeholder="Testo descrittivo..." value={formData.testo} 
                onChange={e => setFormData({...formData, testo: e.target.value})} />

      {/* Sezione Dinamica: Componenti (Mattoni) */}
      <InlineSection title="Componenti (Mattoni richiesti)" 
        items={formData.componenti}
        onAdd={() => addInline('componenti', { caratteristica: '', valore: 1 })}
        renderItem={(item, i) => (
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-900 p-2 rounded" value={item.caratteristica} onChange={e => updateInline('componenti', i, 'caratteristica', e.target.value)}>
              <option value="">Seleziona Caratteristica...</option>
              {punteggiList.filter(p => p.tipo === 'CA').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input type="number" className="w-20 bg-gray-900 p-2 rounded" value={item.valore} onChange={e => updateInline('componenti', i, 'valore', e.target.value)} />
            <button onClick={() => removeInline('componenti', i)} className="text-red-500 px-2">✕</button>
          </div>
        )}
      />

      {/* Sezione Dinamica: Modificatori Attivi (Solo Infusioni) */}
      <InlineSection title="Modificatori Attivi (Bonus al personaggio)" 
        items={formData.modificatori}
        onAdd={() => addInline('modificatori', { statistica: '', valore: 0, tipo_modificatore: 'ADD' })}
        renderItem={(item, i) => (
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-900 p-2 rounded" value={item.statistica} onChange={e => updateInline('modificatori', i, 'statistica', e.target.value)}>
              <option value="">Statistica...</option>
              {statsOptions.map(s => <option key={s.parametro} value={s.parametro}>{s.nome}</option>)}
            </select>
            <input type="number" className="w-20 bg-gray-900 p-2 rounded" value={item.valore} onChange={e => updateInline('modificatori', i, 'valore', e.target.value)} />
            <button onClick={() => removeInline('modificatori', i)} className="text-red-500 px-2">✕</button>
          </div>
        )}
      />

      <div className="flex gap-4 pt-4">
        <button onClick={handleSave} className="flex-1 bg-amber-600 py-3 rounded-lg font-bold">SALVA TECNICA</button>
        <button onClick={onBack} className="bg-gray-700 px-6 rounded-lg">Annulla</button>
      </div>
    </div>
  );
};

// Sotto-componenti helper per pulizia codice
const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">{label}</label>
    <input className="w-full bg-gray-900 p-2 rounded border border-gray-700" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const Select = ({ label, value, options, onChange }) => (
  <div>
    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">{label}</label>
    <select className="w-full bg-gray-900 p-2 rounded border border-gray-700" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Seleziona...</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>
  </div>
);

const InlineSection = ({ title, items, onAdd, renderItem }) => (
  <div className="border border-gray-700 p-4 rounded-lg bg-gray-900/30">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase">{title}</h3>
      <button onClick={onAdd} className="text-xs bg-indigo-600 px-2 py-1 rounded">+ Aggiungi</button>
    </div>
    <div className="space-y-2">{items.map(renderItem)}</div>
  </div>
);

export default InfusioneEditor;