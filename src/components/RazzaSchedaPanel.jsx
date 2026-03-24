import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Loader2, X } from 'lucide-react';
import { getTrattiRazzaOpzioni, acquireAbilita } from '../api';

const DEFAULT_ARCH_TEXT = 'Archetipo - Umano';

function groupByAura(items) {
  const map = new Map();
  for (const row of items || []) {
    const key = row.aura_nome || '—';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

export default function RazzaSchedaPanel({
  personaggioId,
  razza,
  onLogout,
  onRefresh,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const auraInnata = Number(razza?.aura_innata ?? 0) || 0;
  const canEdit = auraInnata >= 1;
  const testoRazza = razza?.testo || `Razza: ${DEFAULT_ARCH_TEXT}`;

  const loadOptions = useCallback(async () => {
    if (!personaggioId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTrattiRazzaOpzioni(personaggioId, onLogout);
      setPayload(data);
    } catch (e) {
      setError(e.message || 'Impossibile caricare le opzioni di razza.');
    } finally {
      setLoading(false);
    }
  }, [personaggioId, onLogout]);

  useEffect(() => {
    if (open) loadOptions();
  }, [open, loadOptions]);

  const archetipi = payload?.archetipi_selezionabili || [];
  const forme = payload?.forme_selezionabili || [];

  const [archetipoId, setArchetipoId] = useState('');
  const [formaId, setFormaId] = useState('');

  useEffect(() => {
    if (!open || !payload) return;
    const curA = payload.archetipo_abilita_id != null ? String(payload.archetipo_abilita_id) : '';
    const curF = payload.forma_abilita_id != null ? String(payload.forma_abilita_id) : '';
    setArchetipoId(curA);
    setFormaId(curF);
  }, [open, payload]);

  const selectedArchetipo = useMemo(
    () => archetipi.find((a) => String(a.id) === String(archetipoId)),
    [archetipi, archetipoId]
  );

  const formeFiltrate = useMemo(() => {
    if (!selectedArchetipo) return forme;
    return forme.filter((f) => f.aura_id === selectedArchetipo.aura_id);
  }, [forme, selectedArchetipo]);

  useEffect(() => {
    if (!formaId) return;
    if (!formeFiltrate.some((f) => String(f.id) === String(formaId))) {
      setFormaId('');
    }
  }, [formeFiltrate, formaId]);

  const handleSave = async () => {
    if (!personaggioId || !archetipoId) {
      setError('Seleziona un archetipo.');
      return;
    }
    const curA = payload?.archetipo_abilita_id != null ? Number(payload.archetipo_abilita_id) : null;
    const curF = payload?.forma_abilita_id != null ? Number(payload.forma_abilita_id) : null;
    const nextA = Number(archetipoId);
    const nextF = formaId ? Number(formaId) : null;

    if (nextA === curA && nextF === curF) {
      setOpen(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (nextA !== curA) {
        await acquireAbilita(nextA, personaggioId, onLogout);
      }
      if (auraInnata >= 2 && nextF != null && nextF !== curF) {
        await acquireAbilita(nextF, personaggioId, onLogout);
      }
      if (onRefresh) await onRefresh();
      setOpen(false);
    } catch (e) {
      setError(e.message || 'Salvataggio non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const archetipiByAura = useMemo(() => groupByAura(archetipi), [archetipi]);

  return (
    <div className="mb-6 p-4 bg-gray-800/80 rounded-xl border border-gray-700/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-900/40 border border-violet-700/50">
            <Users className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Razza</h3>
            <p className="text-gray-100 font-medium">{testoRazza}</p>
            {auraInnata < 2 && (
              <p className="text-xs text-gray-500 mt-1">
                Aura Innata (AIN): {auraInnata}
                {auraInnata === 0 ? ' (solo Umano in scheda)' : ''}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-700 hover:bg-violet-600 text-white transition-colors"
          >
            Modifica
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h4 className="text-lg font-bold text-violet-300">Archetipo e forma</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
                aria-label="Chiudi"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-700/50 text-red-200 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-2 text-slate-400 py-8">
                  <Loader2 className="animate-spin" size={22} />
                  Caricamento…
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Archetipo
                    </label>
                    <select
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm"
                      value={archetipoId}
                      onChange={(e) => setArchetipoId(e.target.value)}
                    >
                      <option value="">— Seleziona —</option>
                      {[...archetipiByAura.entries()].map(([auraNome, rows]) => (
                        <optgroup key={auraNome} label={auraNome}>
                          {rows.map((r) => (
                            <option key={r.id} value={String(r.id)}>
                              {r.nome}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {auraInnata >= 2 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Forma (opzionale)
                      </label>
                      <select
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm"
                        value={formaId}
                        onChange={(e) => setFormaId(e.target.value)}
                        disabled={!selectedArchetipo}
                      >
                        <option value="">— Nessuna —</option>
                        {formeFiltrate.map((r) => (
                          <option key={r.id} value={String(r.id)}>
                            {r.nome}
                          </option>
                        ))}
                      </select>
                      {!selectedArchetipo && (
                        <p className="text-xs text-slate-500 mt-1">
                          Scegli prima l&apos;archetipo per filtrare le forme sulla stessa aura.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={saving || loading || !archetipoId}
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
