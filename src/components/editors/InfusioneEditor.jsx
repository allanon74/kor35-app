import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { getStatisticheList, staffCreateInfusione, staffUpdateInfusione, getBodySlots } from '../../api';
import CharacteristicInline from './inlines/CharacteristicInline';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';
import MultiSelectBodySlots from './MultiSelectBodySlots';
import RichTextEditor from '../RichTextEditor';

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

  // CASO SPECIALE PIVOT: Se index è -1, stiamo inserendo una statistica che non era nel DB
  if (index === -1 && key === 'statistiche_base') {
    newList.push({
      statistica: value.statId,
      valore_base: value.value
    });
  } else {
    // Caso normale: aggiornamento record esistente
    newList[index] = { ...newList[index], [field]: value };
  }
  
  setFormData({ ...formData, [key]: newList });
};

  /* Fix per caricamento statistica_cariche se arriva come oggetto */
  const currentCaricheId = formData.statistica_cariche?.id || formData.statistica_cariche;

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-6xl mx-auto overflow-y-auto max-h-[85vh] text-white">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-indigo-400 uppercase tracking-tighter">
          {formData.id ? `Editing: ${formData.nome}` : 'Nuova Infusione'}
        </h2>
        <div className="flex gap-3">
           <button onClick={() => {/* handleSave logic */}} className="bg-amber-600 px-8 py-2 rounded-lg font-black text-sm">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 px-6 py-2 rounded-lg font-bold text-sm">ANNULLA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/20 p-4 rounded-xl">
        <div className="md:col-span-2">
          <Input label="Nome" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
        </div>
        <Select label="Risultato" value={formData.tipo_risultato} 
                options={[{id: 'POT', nome: 'Potenziamento'}, {id: 'AUM', nome: 'Aumento'}]} 
                onChange={v => setFormData({...formData, tipo_risultato: v})} />
        <div className="flex items-center gap-3 pt-6 justify-center">
            <input type="checkbox" className="w-5 h-5 rounded accent-indigo-500" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} />
            <label className="text-xs font-black uppercase text-gray-500">Pesante</label>
        </div>
      </div>

      {/* SEZIONE RICARICA AMPLIATA */}
      <div className="bg-indigo-900/10 p-5 rounded-xl border border-indigo-500/20 space-y-4">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Parametri Tecnici e Ricarica</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select label="Stat. Cariche" value={currentCaricheId} options={statsOptions}
                    onChange={v => setFormData({...formData, statistica_cariche: v ? parseInt(v, 10) : null})} />
            <Input label="Costo Crediti" type="number" value={formData.costo_ricarica_crediti} onChange={v => setFormData({...formData, costo_ricarica_crediti: v})} />
            <Input label="Durata (sec)" type="number" value={formData.durata_attivazione} onChange={v => setFormData({...formData, durata_attivazione: v})} />
        </div>
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 uppercase font-black mb-1">Metodo e Note di Ricarica (Testo Libero)</label>
            <textarea 
                className="w-full bg-gray-900/60 p-3 rounded border border-gray-700 text-sm focus:border-indigo-500 outline-none min-h-[100px]"
                value={formData.metodo_ricarica} 
                onChange={e => setFormData({...formData, metodo_ricarica: e.target.value})} 
            />
        </div>
      </div>

      {/* VISIBILITÀ CONDIZIONALE SLOT CORPO */}
      {formData.tipo_risultato === 'AUM' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <MultiSelectBodySlots 
                value={formData.slot_corpo_permessi} 
                allSlots={allBodySlots} 
                onChange={v => setFormData({...formData, slot_corpo_permessi: v})} 
            />
        </div>
      )}

      <div className="flex flex-col bg-gray-900/40 p-4 rounded-xl border border-gray-700/50">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Descrizione Narrativa e Tecnica</h3>
          <RichTextEditor 
            
            value={formData.testo}
            placeholder="Inserisci la descrizione narrativa e tecnica..."
            onChange={(content) => setFormData({...formData, testo: content})}
          />
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