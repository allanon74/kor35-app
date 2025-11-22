import React, { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { getModelliAura, selezionaModelloAura } from '../api';
import { useCharacter } from './CharacterContext';
import IconaPunteggio from './IconaPunteggio';

const ModelloAuraSelectionModal = ({ aura, onClose }) => {
  const { selectedCharacterId, refreshCharacterData, onLogout } = useCharacter();
  const [modelli, setModelli] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModelliAura(aura.id);
        setModelli(data);
      } catch (err) {
        console.error(err);
        alert("Errore nel caricamento dei modelli");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [aura, onClose]);

  const handleSelect = async (modello) => {
    if (!window.confirm(`Sei sicuro di voler scegliere il modello "${modello.nome}"? Questa scelta NON può essere cambiata.`)) return;

    setSelecting(modello.id);
    try {
      await selezionaModelloAura(selectedCharacterId, modello.id, onLogout);
      await refreshCharacterData(); // Ricarica il PG per aggiornare la UI
      onClose();
    } catch (err) {
      alert("Errore durante la selezione: " + err.message);
      setSelecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        <div className="p-6 border-b border-gray-700 flex justify-between items-center shrink-0">
          <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-6 h-6" style={{ backgroundColor: aura.colore, maskImage: `url(${aura.icona_url})`, WebkitMaskImage: `url(${aura.icona_url})` }} />
                  Scegli Modello per {aura.nome}
              </h2>
              <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Attenzione: La scelta è definitiva!
              </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
             <p className="text-center text-gray-400">Caricamento modelli...</p>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modelli.map(mod => (
                    <div 
                        key={mod.id} 
                        onClick={() => !selecting && handleSelect(mod)}
                        className={`border border-gray-700 bg-gray-900 rounded-lg p-4 hover:border-indigo-500 hover:bg-gray-800 cursor-pointer transition-all relative group ${selecting === mod.id ? 'opacity-50' : ''}`}
                    >
                        <h3 className="font-bold text-lg text-white mb-2">{mod.nome}</h3>
                        
                        {mod.mattoni_proibiti && mod.mattoni_proibiti.length > 0 ? (
                            <div>
                                {/* CORREZIONE QUI SOTTO: RIMOSSO 'block' */}
                                <span className="text-xs text-red-400 uppercase font-bold mb-1 flex items-center gap-1">
                                    <Lock size={10} /> Mattoni Bloccati:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {mod.mattoni_proibiti.map(m => (
                                        <div key={m.id} title={m.nome} className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-gray-700">
                                            <IconaPunteggio url={m.icona_url} color={m.colore} size="xs" mode="mask" />
                                            <span className="text-xs text-gray-300">{m.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-green-400 italic">Nessuna restrizione.</p>
                        )}

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">Seleziona</span>
                        </div>
                    </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelloAuraSelectionModal;