import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { getStatisticheList, staffCreateInfusione, staffUpdateInfusione, getBodySlots } from '../../api';
// Inlines
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
    tipo_risultato: 'MOD', is_pesante: false,
    statistica_cariche: '', metodo_ricarica: 'MANU',
    costo_ricarica_crediti: 0, durata_attivazione: 0,
    slot_corpo_permessi: [], 
    componenti: [],          // In Django: InfusioneCaratteristica
    statistiche_base: [],    // In Django: InfusioneStatisticaBase
    modificatori: []         // In Django: InfusioneStatistica (con condizioni)
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
      if (formData.id) await staffUpdateInfusione(formData.id, formData, onLogout);
      else await staffCreateInfusione(formData, onLogout);
      alert("Infusione salvata!");
      onBack();
    } catch (e) { alert("Errore: " + e.message); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-5xl mx-auto overflow-y-auto max-h-[85vh] text-white">
      {/* HEADER EDIT */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-indigo-400">
          {formData.id ? `Modifica: ${formData.nome}` : 'Nuova Infusione'}
        </h2>
        <div className="flex gap-2">
           <button onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded font-bold text-sm">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-bold text-sm">ANNULLA</button>
        </div>
      </div>

      {/* RIGA 1: BASE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Input label="Nome" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
        </div>
        <Select label="Tipo Risultato" value={formData.tipo_risultato} 
                options={[{id:'MAT', nome:'Materia'}, {id:'MOD', nome:'Mod'}, {id:'INN', nome:'Innesto'}]} 
                onChange={v => setFormData({...formData, tipo_risultato: v})} />
        <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" className="w-5 h-5 rounded accent-indigo-500" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} />
            <label className="text-xs font-bold uppercase text-gray-400">Pesante</label>
        </div>
      </div>

      {/* RIGA 2: AURE E FORMULE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900/20 p-4 rounded-lg">
        <Select label="Aura Richiesta" value={formData.aura_richiesta} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_richiesta: v})} />
        <Select label="Aura Infusione" value={formData.aura_infusione} 
                options={punteggiList.filter(p => p.tipo === 'AU')} 
                onChange={v => setFormData({...formData, aura_infusione: v})} />
        <Input label="Formula Attacco" value={formData.formula_attacco} onChange={v => setFormData({...formData, formula_attacco: v})} />
      </div>

      {/* RIGA 3: CARICHE E RICARICA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/20 p-4 rounded-lg">
        <Select label="Statistica Cariche" value={formData.statistica_cariche} options={statsOptions} propName="parametro"
                onChange={v => setFormData({...formData, statistica_cariche: v})} />
        <Select label="Metodo Ricarica" value={formData.metodo_ricarica} 
                options={[{id:'MANU', nome:'Manuale'}, {id:'CRED', nome:'Crediti'}, {id:'AUTO', nome:'Automatica'}]} 
                onChange={v => setFormData({...formData, metodo_ricarica: v})} />
        <Input label="Costo Crediti" type="number" value={formData.costo_ricarica_crediti} onChange={v => setFormData({...formData, costo_ricarica_crediti: v})} />
        <Input label="Durata Attiv. (sec)" type="number" value={formData.durata_attivazione} onChange={v => setFormData({...formData, durata_attivazione: v})} />
      </div>

      {/* SLOT CORPO MULTISELECT */}
      <MultiSelectBodySlots 
        selectedSlots={formData.slot_corpo_permessi} 
        allSlots={allBodySlots} 
        onChange={v => setFormData({...formData, slot_corpo_permessi: v})} 
      />

      <textarea className="w-full bg-gray-900 p-3 rounded border border-gray-700 text-sm italic" rows="4" 
                placeholder="Testo descrittivo tecnico (Summernote supportato lato backend)..." 
                value={formData.testo} onChange={e => setFormData({...formData, testo: e.target.value})} />

      {/* INLINES DINAMICHE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          onAdd={() => setFormData({...formData, statistiche_base: [...formData.statistiche_base, {statistica:'', valore_base:0}]})}
          onChange={(i, f, v) => updateInline('statistiche_base', i, f, v)}
          onRemove={(i) => setFormData({...formData, statistiche_base: formData.statistiche_base.filter((_, idx) => idx !== i)})}
        />
      </div>

      <StatModInline 
        items={formData.modificatori} 
        options={statsOptions}
        // Passiamo le liste filtrate dal contesto globale
        auraOptions={punteggiList.filter(p => p.tipo === 'AU')}
        elementOptions={punteggiList.filter(p => p.tipo === 'EL')}
        onAdd={() => setFormData({
          ...formData, 
          modificatori: [
            ...formData.modificatori, 
            {
              statistica: '', 
              valore: 0, 
              tipo_modificatore: 'ADD',
              usa_limitazione_aura: false,
              limit_a_aure: [],
              usa_limitazione_elemento: false,
              limit_a_elementi: [],
              usa_condizione_text: false,
              condizione_text: ''
            }
          ]
        })}
        onChange={(i, f, v) => updateInline('modificatori', i, f, v)}
        onRemove={(i) => setFormData({
          ...formData, 
          modificatori: formData.modificatori.filter((_, idx) => idx !== i)
        })}
      />
    </div>
  );
};

// Helper components (interni al file o separati)
const Input = ({ label, value, onChange, type="text" }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <input type={type} className="w-full bg-gray-900 p-2 rounded border border-gray-700 text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const Select = ({ label, value, options, onChange, propName="id" }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">{label}</label>
      <select className="w-full bg-gray-900 p-2 rounded border border-gray-700 text-sm" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-</option>
        {options.map(o => <option key={o[propName]} value={o[propName]}>{o.nome}</option>)}
      </select>
    </div>
);

export default InfusioneEditor;