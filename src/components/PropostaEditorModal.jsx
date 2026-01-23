import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Send, Loader2 } from 'lucide-react';
import { useCharacter } from './CharacterContext';

const PropostaEditorModal = ({ transazione, onClose, onSave, onLogout }) => {
  const { selectedCharacterData } = useCharacter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    crediti_da_dare: 0,
    crediti_da_ricevere: 0,
    oggetti_da_dare: [],
    oggetti_da_ricevere: [],
    messaggio: ''
  });

  // Ottieni oggetti disponibili dall'inventario
  const oggettiDisponibili = selectedCharacterData?.oggetti || [];

  const handleSave = async () => {
    if (formData.crediti_da_dare < 0 || formData.crediti_da_ricevere < 0) {
      alert("I crediti non possono essere negativi!");
      return;
    }

    if (formData.crediti_da_dare > selectedCharacterData?.crediti) {
      alert("Non hai abbastanza crediti!");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      alert("Errore: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOggetto = (oggettoId, tipo) => {
    const field = tipo === 'dare' ? 'oggetti_da_dare' : 'oggetti_da_ricevere';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(oggettoId)
        ? prev[field].filter(id => id !== oggettoId)
        : [...prev[field], oggettoId]
    }));
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
            <Dialog.Title className="text-xl font-bold text-white">
              {transazione?.ultima_proposta_iniziatore && transazione?.ultima_proposta_destinatario
                ? 'Rilancio Proposta'
                : 'Controproposta'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto grow custom-scrollbar space-y-6">
            {/* Crediti */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Crediti che DAI
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.crediti_da_dare}
                  onChange={e => setFormData({...formData, crediti_da_dare: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponibili: {selectedCharacterData?.crediti || 0} CR
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Crediti che RICEVI
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.crediti_da_ricevere}
                  onChange={e => setFormData({...formData, crediti_da_ricevere: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Oggetti da Dare */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Oggetti che DAI
              </label>
              <div className="bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {oggettiDisponibili.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nessun oggetto disponibile</p>
                ) : (
                  oggettiDisponibili.map(oggetto => (
                    <label key={oggetto.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.oggetti_da_dare.includes(oggetto.id)}
                        onChange={() => toggleOggetto(oggetto.id, 'dare')}
                        className="rounded"
                      />
                      <span className="text-sm text-white">{oggetto.nome}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Oggetti da Ricevere */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Oggetti che RICEVI
              </label>
              <div className="bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-500 italic">
                  Seleziona gli oggetti che vuoi ricevere dalla controparte
                </p>
                {/* Nota: In una versione completa, qui mostreresti gli oggetti dell'altro personaggio */}
              </div>
            </div>

            {/* Messaggio */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Messaggio (opzionale)
              </label>
              <textarea
                value={formData.messaggio}
                onChange={e => setFormData({...formData, messaggio: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white min-h-[100px]"
                placeholder="Aggiungi un messaggio alla proposta..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-sm"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Invio...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Invia Proposta
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PropostaEditorModal;
