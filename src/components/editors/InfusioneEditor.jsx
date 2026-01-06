import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { getStatisticheList, staffCreateInfusione, staffUpdateInfusione, getBodySlots } from '../../api';
import CharacteristicInline from './inlines/CharacteristicInline';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';
import MultiSelectBodySlots from './MultiSelectBodySlots';

const InfusioneEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [statsOptions, setStatsOptions] = useState([]);
  const allBodySlots = getBodySlots();
  
  const [formData, setFormData] = useState(initialData || {
    nome: '', testo: '', formula_attacco: '',
    aura_richiesta: '', aura_infusione: '',
    tipo_risultato: 'POT', is_pesante: false,
    statistica_cariche: null, metodo_ricarica: '',
    costo_ricarica_crediti: 0, durata_attivazione: 0,
    slot_corpo_permessi: '', 
    componenti: [],
    statistiche_base: [],
    modificatori: []
  });

  useEffect(() => {
    getStatisticheList(onLogout).then(setStatsOptions);
  }, [onLogout]);

  const updateInline = (key, index, field, value) => {
    const newList = [...formData[key]];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, [key]: newList });
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData };
      // Sanificazione dati tecnici
      if (dataToSend.id) await staffUpdateInfusione(dataToSend.id, dataToSend, onLogout);
      else await staffCreateInfusione(dataToSend, onLogout);
      alert("Salvato con successo!");
      onBack();
    } catch (e) { alert("Errore: " + e.message); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-6xl mx-auto overflow-y-auto max-h-[85vh] text-white shadow-2xl border border-gray-700">
      
      {/* HEADER AZIONI */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-indigo-400 uppercase tracking-tighter">
          {formData.id ? `Editing: ${formData.nome}` : 'Creazione Nuova Infusione'}
        </h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 px-8 py-2 rounded-lg font-black text-sm transition-all shadow-lg">SALVA TECNICA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm transition-all">ANNULLA</button>
        </div>
      </div>

      {/* SEZIONE 1: IDENTITÀ E TIPO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/20 p-4 rounded-xl">
        <div className="md:col-span-2">
          <Input label="Nome Infusione" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
        </div>
        <Select label="Tipo Risultato" value={formData.tipo_risultato} 
                options={[{id: 'POT', nome: 'Potenziamento'}, {id: 'AUM', nome: 'Aumento Corporeo'}]} 
                onChange={v => setFormData({...formData, tipo_risultato: v})} />
        <div className="flex items-center gap-3 pt-6 justify-center">
            <input type="checkbox" className="w-6 h-6 rounded accent-indigo-500 cursor-pointer" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} />
            <label className="text-xs font-black uppercase text-gray-400 cursor-pointer">Oggetto Pesante</label>
        </div>
      </div>

      {/* SEZIONE 2: REQUISITI AURA E FORMULE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-700/50">
        <Select label="Aura Richiesta" value={formData.aura_richiesta} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_richiesta: v})} />
        <Select label="Aura Infusione" value={formData.aura_infusione} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_infusione: v})} />
        <Input label="Formula Attacco" placeholder="es. 1d10 + @for" value={formData.formula_attacco} onChange={v => setFormData({...formData, formula_attacco: v})} />
      </div>

      {/* SEZIONE 3: GESTIONE CARICHE E RICARICA (LAYOUT MIGLIORATO) */}
      <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Statistica Cariche (Max)" value={formData.statistica_cariche} options={statsOptions}
                    onChange={v => setFormData({...formData, statistica_cariche: v ? parseInt(v, 10) : null})} />
            <Input label="Costo Ricarica (Crediti)" type="number" value={formData.costo_ricarica_crediti} onChange={v => setFormData({...formData, costo_ricarica_crediti: v})} />
            <Input label="Durata Attivazione (secondi)" type="number" value={formData.durata_attivazione} onChange={v => setFormData({...formData, durata_attivazione: v})} />
        </div>
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 uppercase font-black mb-1">Metodo di Ricarica / Note Ricarica</label>
            <textarea 
                className="w-full bg-gray-900 p-3 rounded border border-gray-700 text-sm focus:border-indigo-500 outline-none min-h-[80px]"
                placeholder="Descrivi come si ricarica l'oggetto (es. 'Si ricarica alle ore 04.00' o 'Ricarica manuale con kit')..."
                value={formData.metodo_ricarica} 
                onChange={e => setFormData({...formData, metodo_ricarica: e.target.value})} 
            />
        </div>
      </div>

      <MultiSelectBodySlots 
        value={formData.slot_corpo_permessi} 
        allSlots={allBodySlots} 
        onChange={v => setFormData({...formData, slot_corpo_permessi: v})} 
      />

      <div className="flex flex-col bg-gray-900/40 p-4 rounded-xl border border-gray-700/50">
          <label className="text-[10px] text-gray-500 uppercase font-black mb-1">Testo Descrittivo Completo</label>
          <textarea className="w-full bg-gray-900 p-4 rounded border border-gray-700 text-sm italic font-serif min-h-[120px]" 
                    placeholder="Inserisci la descrizione narrativa e tecnica..." 
                    value={formData.testo} onChange={e => setFormData({...formData, testo: e.target.value})} />
      </div>

      {/* INLINES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
          onAdd={() => setFormData({...formData, statistiche_base: [...formData.statistiche_base, {statistica:null, valore_base:0}]})}
          onChange={(i, f, v) => updateInline('statistiche_base', i, f, v)}
          onRemove={(i) => setFormData({...formData, statistiche_base: formData.statistiche_base.filter((_, idx) => idx !== i)})}
        />
      </div>

      <StatModInline 
        items={formData.modificatori} 
        options={statsOptions}
        auraOptions={punteggiList.filter(p => p.tipo === 'AU')}
        elementOptions={punteggiList.filter(p => p.tipo === 'EL')}
        onAdd={() => setFormData({
          ...formData, 
          modificatori: [
            ...formData.modificatori, 
            {
              statistica: null, valore: 0, tipo_modificatore:'ADD',
              usa_limitazione_aura: false, limit_a_aure: [],
              usa_limitazione_elemento: false, limit_a_elementi: [],
              usa_condizione_text: false, condizione_text: ''
            }
          ]
        })}
        onChange={(i, f, v) => updateInline('modificatori', i, f, v)}
        onRemove={(i) => setFormData({...formData, modificatori: formData.modificatori.filter((_, idx) => idx !== i)})}
      />
    </div>
  );
};

// SOTTO-COMPONENTI HELPER
const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div className="w-full">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full bg-gray-900 p-2 rounded border border-gray-700 text-sm text-white focus:border-indigo-500 outline-none" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const Select = ({ label, value, options, onChange }) => (
    <div className="w-full">
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <select 
        className="w-full bg-gray-900 p-2 rounded border border-gray-700 text-sm text-white focus:border-indigo-500 outline-none" 
        value={value ? String(value) : ""} 
        onChange={e => onChange(e.target.value)}
      >
        <option value="">-</option>
        {options.map(o => <option key={o.id} value={String(o.id)}>{o.nome}</option>)}
      </select>
    </div>
);

export default InfusioneEditor;