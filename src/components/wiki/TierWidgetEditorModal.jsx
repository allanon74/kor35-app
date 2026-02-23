import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';
import { getWikiTierList, getWikiTierWidgetList, createWikiTierWidget, updateWikiTierWidget } from '../../api';

/**
 * Modal per configurare il Widget Tier (come ButtonWidgetEditorModal).
 * Permette di selezionare un Tier e configurarne la visualizzazione.
 */
export default function TierWidgetEditorModal({ onClose, onSave, initialData = null }) {
  const [tiers, setTiers] = useState([]);
  const [existingWidgets, setExistingWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    tier: initialData?.tier || null,
    abilities_collapsible: initialData?.abilities_collapsible ?? true,
    abilities_collapsed_by_default: initialData?.abilities_collapsed_by_default ?? false,
    show_description: initialData?.show_description ?? true,
    color_style: initialData?.color_style || 'default',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tiersData, widgetsData] = await Promise.all([
          getWikiTierList(),
          getWikiTierWidgetList().catch(() => []),
        ]);
        setTiers(tiersData);
        setExistingWidgets(Array.isArray(widgetsData) ? widgetsData : []);
      } catch (err) {
        console.error('Errore caricamento tier/widgets:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tier: initialData.tier ?? null,
        abilities_collapsible: initialData.abilities_collapsible ?? true,
        abilities_collapsed_by_default: initialData.abilities_collapsed_by_default ?? false,
        show_description: initialData.show_description ?? true,
        color_style: initialData.color_style || 'default',
      });
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!formData.tier) {
      alert('Seleziona un Tier');
      return;
    }

    try {
      const payload = {
        tier: typeof formData.tier === 'object' ? formData.tier.id : formData.tier,
        abilities_collapsible: formData.abilities_collapsible,
        abilities_collapsed_by_default: formData.abilities_collapsed_by_default,
        show_description: formData.show_description,
        color_style: formData.color_style,
      };

      let response;
      if (initialData?.id) {
        response = await updateWikiTierWidget(initialData.id, payload);
      } else {
        response = await createWikiTierWidget(payload);
      }
      onSave(response);
      onClose();
    } catch (err) {
      console.error('Errore salvataggio widget tier:', err);
      alert('Errore durante il salvataggio. Controlla la console.');
    }
  };

  const selectedTier = typeof formData.tier === 'object' ? formData.tier : tiers.find(t => t.id === formData.tier);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Widget Tier</h2>
            <p className="text-sm text-gray-600 mt-1">Configura la visualizzazione del tier</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Caricamento...</div>
          ) : (
            <>
              {/* Selezione Tier */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tier *</label>
                <select
                  value={(typeof formData.tier === 'object' ? formData.tier?.id : formData.tier) ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null;
                    const tier = tiers.find(t => t.id === id);
                    setFormData(f => ({ ...f, tier: tier || id }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Seleziona un Tier --</option>
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Abilità in collapsible */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <input
                  type="checkbox"
                  id="abilities_collapsible"
                  checked={formData.abilities_collapsible}
                  onChange={(e) => setFormData(f => ({ ...f, abilities_collapsible: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="abilities_collapsible" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Sezione abilità collassabile (default: sì)
                </label>
              </div>

              {/* Collassata di default (solo se collapsible) */}
              {formData.abilities_collapsible && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <input
                    type="checkbox"
                    id="abilities_collapsed_by_default"
                    checked={formData.abilities_collapsed_by_default}
                    onChange={(e) => setFormData(f => ({ ...f, abilities_collapsed_by_default: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="abilities_collapsed_by_default" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Sezione abilità chiusa di default (default: no, cioè aperta)
                  </label>
                </div>
              )}

              {/* Mostra descrizione */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <input
                  type="checkbox"
                  id="show_description"
                  checked={formData.show_description}
                  onChange={(e) => setFormData(f => ({ ...f, show_description: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="show_description" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mostra descrizione del tier (default: sì)
                </label>
              </div>

              {/* Stile cromatico */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Stile cromatico</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(CHROMATIC_STYLES).map(([key, style]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, color_style: key }))}
                      className={`p-2 border-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                        formData.color_style === key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded bg-gradient-to-br ${style.gradient}`} />
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium transition-colors">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.tier || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData?.id ? 'Salva Modifiche' : 'Crea e Inserisci'}
          </button>
        </div>
      </div>
    </div>
  );
}
