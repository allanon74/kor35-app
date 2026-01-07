import React, { useState, useEffect } from 'react';
import { useCharacter } from '../CharacterContext';
import { staffUpdateOggettoBase, staffCreateOggettoBase, staffGetClassiOggetto, getStatisticheList, } from '../../api';
import StatBaseInline from './inlines/StatBaseInline';
import StatModInline from './inlines/StatModInline';

const OggettoBaseEditor = ({ onBack, onLogout, initialData = null }) => {
  const { punteggiList } = useCharacter();
  const [classi, setClassi] = useState([]);
  const [statsOptions, setStatsOptions] = useState([]);
  const [formData, setFormData] = useState(initialData || {
    nome: '', descrizione: '', tipo_oggetto: 'FIS', classe_oggetto: null, cost: 0,
    is_tecnologico: false, is_pesante: false, attacco_base: '', in_vendita: true,
    statistiche_base: [], statistiche_modificatori: []
  });

  useEffect(() => { 
    staffGetClassiOggetto(onLogout).then(setClassi);
    getStatisticheList(onLogout).then(setStatsOptions);
  }, [onLogout]);

  const handleSave = async () => {
    try {
        const data = { ...formData, classe_oggetto: formData.classe_oggetto?.id || formData.classe_oggetto || null };
        if (formData.id) await staffUpdateOggettoBase(formData.id, data, onLogout);
        else await staffCreateOggettoBase(data, onLogout);
        onBack();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6 max-w-7xl mx-auto border border-gray-700 shadow-2xl text-white">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">Oggetto Base (Listino)</h2>
        <div className="flex gap-3">
           <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg font-black text-sm">SALVA</button>
           <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm">ANNULLA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-xl">
        <div className="md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Nome Template</label>
            <input className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        </div>
        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-1">Costo (CR)</label>
            <input type="number" className="w-full bg-gray-950 p-2 rounded border border-gray-700 text-sm" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} />
        </div>
        <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.in_vendita} onChange={e => setFormData({...formData, in_vendita: e.target.checked})} /> In Vendita</label>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={formData.is_pesante} onChange={e => setFormData({...formData, is_pesante: e.target.checked})} /> Pesante</label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatBaseInline 
            title="Statistiche Base Template" 
            items={formData.statistiche_base} 
            // MODIFICA: usa statsOptions
            options={statsOptions}
            onChange={(i, f, v) => {
                const newStats = [...formData.statistiche_base];
                
                if (i === -1) {
                // Se il record non esiste (i === -1), lo aggiungiamo usando i dati passati da StatBaseInline
                // v in questo caso è l'oggetto { statId, value } inviato dal componente inline
                newStats.push({
                    statistica: v.statId,
                    valore_base: v.value
                });
                } else {
                // Modifica di un record esistente
                newStats[i][f] = v;
                }
                
                setFormData({ ...formData, statistiche_base: newStats });
            }} 
            onRemove={i => {
                const n = formData.statistiche_base.filter((_, idx) => idx !== i);
                setFormData({...formData, statistiche_base: n});
            }}
          />
          <StatModInline title="Modificatori Template" items={formData.statistiche_modificatori} options={punteggiList.filter(p => p.tipo === 'ST')} onAdd={() => setFormData({...formData, statistiche_modificatori: [...formData.statistiche_modificatori, {statistica:'', valore:0, tipo_modificatore:'ADD'}]})} onChange={(i,f,v) => {const n=[...formData.statistiche_modificatori]; n[i][f]=v; setFormData({...formData, statistiche_modificatori:n});}} onRemove={i => setFormData({...formData, statistiche_modificatori: formData.statistiche_modificatori.filter((_,idx)=>idx!==i)})} />
      </div>
    </div>
  );
};

export default OggettoBaseEditor;