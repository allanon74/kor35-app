import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CHROMATIC_STYLES } from '../../utils/chromaticStyles';
import { getWikiTierList, getWikiTierWidget } from '../../api';

/**
 * Modal per creare o modificare un Widget Tier (tier + opzioni di visualizzazione).
 */
export default function TierWidgetEditorModal({ onClose, onSave, initialData = null }) {
  const [tiers, setTiers] = useState([]);
  const [tierId, setTierId] = useState(initialData?.tier ?? '');
  const [abilitiesCollapsible, setAbilitiesCollapsible] = useState(initialData?.abilities_collapsible ?? true);
  const [abilitiesCollapsedByDefault, setAbilitiesCollapsedByDefault] = useState(initialData?.abilities_collapsed_by_default ?? false);
  const [showDescription, setShowDescription] = useState(initialData?.show_description ?? true);
  const [colorStyle, setColorStyle] = useState(initialData?.color_style || 'default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWikiTierList()
      .then(data => setTiers(data || []))
      .catch(err => console.error('Errore caricamento tier:', err));
  }, []);

  // Carica dati widget quando si modifica per id (es. da "Widget Tier in questa pagina")
  useEffect(() => {
    if (initialData?.id && !initialData?.tier) {
      getWikiTierWidget(initialData.id)
        .then(w => {
          setTierId(w.tier);
          setAbilitiesCollapsible(w.abilities_collapsible ?? true);
          setAbilitiesCollapsedByDefault(w.abilities_collapsed_by_default ?? false);
          setShowDescription(w.show_description ?? true);
          setColorStyle(w.color_style || 'default');
        })
        .catch(err => console.error('Errore caricamento widget tier:', err));
    }
  }, [initialData?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tierId) {
      alert('Seleziona un Tier');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tier: Number(tierId),
        abilities_collapsible: abilitiesCollapsible,
        abilities_collapsed_by_default: abilitiesCollapsedByDefault,
        show_description: showDescription,
        color_style: colorStyle || 'default',
      };
      await onSave(payload, initialData?.id);
      onClose();
    } catch (err) {
      console.error('Errore salvataggio widget tier:', err);
      alert(err?.message || 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  const styleKeys = Object.keys(CHROMATIC_STYLES);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">
            {initialData?.id ? 'Modifica Widget Tier' : 'Nuovo Widget Tier'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-xl px-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tier</label>
            <select
              value={tierId}
              onChange={e => setTierId(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm"
              required
            >
              <option value="">— Seleziona tier —</option>
              {(tiers || []).map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Stile colore</label>
            <select
              value={colorStyle}
              onChange={e => setColorStyle(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm"
            >
              {styleKeys.map(key => (
                <option key={key} value={key}>{CHROMATIC_STYLES[key].name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDescription}
                onChange={e => setShowDescription(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Mostra descrizione tier</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={abilitiesCollapsible}
                onChange={e => setAbilitiesCollapsible(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Abilità comprimibili</span>
            </label>
            {abilitiesCollapsible && (
              <label className="flex items-center gap-2 cursor-pointer pl-5">
                <input
                  type="checkbox"
                  checked={abilitiesCollapsedByDefault}
                  onChange={e => setAbilitiesCollapsedByDefault(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Comprimi di default</span>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Salvataggio...' : (initialData?.id ? 'Salva modifiche' : 'Crea widget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
