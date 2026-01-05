import React, { useState, useEffect } from 'react';
import api from '../api';
import { useCharacter } from '../CharacterContext';

const InfusioneEditor = ({ onBack, initialData = null }) => {
  const [formData, setFormData] = useState({
    nome: '', testo: '', formula_attacco: '',
    aura_richiesta: '', aura_infusione: '',
    componenti: [], // {caratteristica, valore}
    statistiche_base: [], // {statistica, valore_base}
    modificatori: [], // {statistica, valore, tipo_modificatore}
    statistica_cariche: '', metodo_ricarica: '',
    costo_ricarica_crediti: 0, durata_attivazione: 0
  });

  // Caricamento dati per i dropdown (Caratteristiche, Aure, Statistiche)
  const [options, setOptions] = useState({ characteristics: [], auras: [], stats: [] });

  useEffect(() => {
    // Se initialData proviene da una proposta, pre-compiliamo i campi
    if (initialData) setFormData(prev => ({ ...prev, ...initialData }));
    
    // Fetch delle opzioni dal backend
    const fetchOptions = async () => {
      const [punteggi, stats] = await Promise.all([
        api.get('/api/punteggi/'),
        api.get('/api/statistiche/')
      ]);
      setOptions({
        characteristics: punteggi.data.filter(p => p.tipo === 'CA'),
        auras: punteggi.data.filter(p => p.tipo === 'AU'),
        stats: stats.data
      });
    };
    fetchOptions();
  }, [initialData]);

  // Gestione liste dinamiche (es. componenti)
  const addRow = (listName, defaultObj) => {
    setFormData({ ...formData, [listName]: [...formData[listName], defaultObj] });
  };

  const removeRow = (listName, index) => {
    const newList = [...formData[listName]];
    newList.splice(index, 1);
    setFormData({ ...formData, [listName]: newList });
  };

  const updateRow = (listName, index, field, value) => {
    const newList = [...formData[listName]];
    newList[index][field] = value;
    setFormData({ ...formData, [listName]: newList });
  };

  const handleSave = async () => {
    try {
      await api.post('/api/staff/infusioni/', formData);
      alert("Infusione salvata con successo!");
      onBack();
    } catch (e) {
      console.error(e);
      alert("Errore durante il salvataggio.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-400">Editor Infusione</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-white">Annulla</button>
      </div>

      {/* Sezione 1: Dati Base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 uppercase font-bold mb-1">Nome</label>
          <input 
            className="bg-gray-900 border border-gray-700 rounded p-2"
            value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 uppercase font-bold mb-1">Aura Richiesta</label>
          <select 
            className="bg-gray-900 border border-gray-700 rounded p-2"
            value={formData.aura_richiesta} onChange={e => setFormData({...formData, aura_richiesta: e.target.value})}
          >
            <option value="">Seleziona Aura</option>
            {options.auras.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex flex-col">
          <label className="text-xs text-gray-400 uppercase font-bold mb-1">Descrizione (Testo)</label>
          <textarea 
            rows="4" className="bg-gray-900 border border-gray-700 rounded p-2"
            value={formData.testo} onChange={e => setFormData({...formData, testo: e.target.value})}
          />
        </div>
      </div>

      {/* Sezione 2: Componenti (Inlines Django) */}
      <div className="mb-8 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1">Componenti (Caratteristiche)</h3>
        {formData.componenti.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select 
              className="flex-1 bg-gray-800 p-1 rounded text-sm"
              value={c.caratteristica} onChange={e => updateRow('componenti', i, 'caratteristica', e.target.value)}
            >
              <option value="">Seleziona...</option>
              {options.characteristics.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            <input 
              type="number" className="w-20 bg-gray-800 p-1 rounded text-sm text-center"
              value={c.valore} onChange={e => updateRow('componenti', i, 'valore', e.target.value)}
            />
            <button onClick={() => removeRow('componenti', i)} className="text-red-500 px-2">✕</button>
          </div>
        ))}
        <button 
          onClick={() => addRow('componenti', {caratteristica: '', valore: 1})}
          className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-3 py-1 rounded mt-2"
        >
          + Aggiungi Componente
        </button>
      </div>

      {/* Sezione 3: Modificatori (Specifica per Infusione) */}
      <div className="mb-8 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1">Modificatori Attivi (Bonus/Malus)</h3>
        {formData.modificatori.map((m, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select 
              className="flex-1 bg-gray-800 p-1 rounded text-sm"
              value={m.statistica} onChange={e => updateRow('modificatori', i, 'statistica', e.target.value)}
            >
              <option value="">Statistica...</option>
              {options.stats.map(o => <option key={o.parametro} value={o.parametro}>{o.nome}</option>)}
            </select>
            <input 
              type="number" className="w-20 bg-gray-800 p-1 rounded text-sm text-center"
              value={m.valore} onChange={e => updateRow('modificatori', i, 'valore', e.target.value)}
            />
            <button onClick={() => removeRow('modificatori', i)} className="text-red-500 px-2">✕</button>
          </div>
        ))}
        <button 
          onClick={() => addRow('modificatori', {statistica: '', valore: 0, tipo_modificatore: 'ADD'})}
          className="text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-3 py-1 rounded mt-2"
        >
          + Aggiungi Modificatore
        </button>
      </div>

      <button 
        onClick={handleSave}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors"
      >
        Salva Infusione
      </button>
    </div>
  );
};

export default InfusioneEditor;