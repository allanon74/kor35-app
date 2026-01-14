import React, { useState, useEffect } from 'react';
import { api, getWikiTierList } from '../../api'; // Usa la tua importazione corretta
// Se usi RichTextEditor importalo, altrimenti usa textarea
import RichTextEditor from '../RichTextEditor'; 

export default function WikiPageEditorModal({ onClose, onSuccess, initialData = null }) {
  // Se abbiamo initialData, usiamo quello, altrimenti valori vuoti
  const [formData, setFormData] = useState({
    titolo: '',
    slug: '',
    parent: '',
    contenuto: '',
    public: false,
    ...initialData // Sovrascrive i default se stiamo modificando
  });
  
  const isEditing = !!initialData?.id; // Flag per sapere se stiamo modificando

  // Helper Widget (copiato dalla versione precedente)
  const [showWidgetHelper, setShowWidgetHelper] = useState(false);
  const [availableTiers, setAvailableTiers] = useState([]);

  useEffect(() => {
    if (showWidgetHelper) {
        getWikiTierList()
            .then(data => setAvailableTiers(data))
            .catch(err => console.error("Err loading tiers", err));
    }
  }, [showWidgetHelper]);

  const insertWidget = (code) => {
    setFormData(prev => ({
        ...prev,
        contenuto: prev.contenuto + `\n<p>${code}</p>\n`
    }));
    setShowWidgetHelper(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (isEditing) {
            // MODALITÀ MODIFICA (PUT)
            await api.put(`/gestione_plot/staff/pagine-regolamento/${initialData.id}/`, formData);
            alert("Pagina aggiornata!");
        } else {
            // MODALITÀ CREAZIONE (POST)
            await api.post('/gestione_plot/staff/pagine-regolamento/', formData);
            alert("Pagina creata!");
        }
        // Passiamo il nuovo slug a onSuccess per fare redirect se necessario
        onSuccess(formData.slug);
    } catch (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore durante il salvataggio.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        <div className="p-4 border-b flex justify-between items-center bg-gray-100 rounded-t-lg">
            <h2 className="font-bold text-xl text-gray-800">
                {isEditing ? `Modifica: ${initialData.titolo}` : 'Nuova Pagina Wiki'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-xl">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            <form id="wiki-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Titolo</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded" 
                            value={formData.titolo}
                            onChange={e => setFormData({...formData, titolo: e.target.value})}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Slug (URL)</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded bg-gray-50" 
                            value={formData.slug}
                            onChange={e => setFormData({...formData, slug: e.target.value})}
                            placeholder="Lascia vuoto per auto-generare"
                        />
                    </div>
                </div>

                {/* --- WIDGET HELPER --- */}
                <div className="bg-blue-50 p-2 rounded border border-blue-200 flex gap-2 items-center">
                    <span className="text-xs font-bold text-blue-800 uppercase">Strumenti:</span>
                    <button 
                        type="button"
                        onClick={() => setShowWidgetHelper(!showWidgetHelper)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                        🧩 Inserisci Widget Tier/Dati
                    </button>
                </div>

                {showWidgetHelper && (
                    <div className="border p-3 bg-gray-50 rounded shadow-inner grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        <p className="col-span-2 text-xs text-gray-500 mb-2">Clicca per inserire il codice nel testo:</p>
                        {availableTiers.map(tier => (
                            <button 
                                key={tier.id}
                                type="button"
                                onClick={() => insertWidget(`{{WIDGET_TIER:${tier.id}}}`)}
                                className="text-left text-sm p-2 bg-white border hover:bg-blue-50 rounded flex justify-between group"
                            >
                                <span className="group-hover:text-blue-700 font-medium">{tier.nome}</span>
                                <span className="text-xs text-gray-400">ID: {tier.id}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contenuto HTML</label>
                    <RichTextEditor 
                        className="w-full border p-2 rounded h-80 font-mono text-sm"
                        value={formData.contenuto}
                        onChange={e => setFormData({...formData, contenuto: e.target.value})}
                    ></RichTextEditor>
                    <p className="text-xs text-gray-500 mt-1">Usa tag HTML standard e i placeholder dei widget.</p>
                </div>

                <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <input 
                        type="checkbox" 
                        id="is_public"
                        checked={formData.public} 
                        onChange={e => setFormData({...formData, public: e.target.checked})}
                    />
                    <label htmlFor="is_public" className="text-sm font-bold text-gray-700">Pagina Pubblica (Visibile a tutti)</label>
                </div>
            </form>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Annulla</button>
            <button type="submit" form="wiki-form" className="px-6 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-800 shadow">
                {isEditing ? 'Salva Modifiche' : 'Crea Pagina'}
            </button>
        </div>
      </div>
    </div>
  );
}