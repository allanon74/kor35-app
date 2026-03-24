import React, { useMemo, useState, useCallback } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { acquireAbilita } from '../api';

const PREFIX_ARCH = 'archetipo - ';
const PREFIX_FORMA = 'forma - ';

/** Nome mostrato senza prefissi "Archetipo - " / "Forma - " */
export function stripRazzaPrefix(nome) {
  if (!nome) return '';
  const s = nome.trim();
  const low = s.toLowerCase();
  if (low.startsWith(PREFIX_ARCH)) return s.slice(PREFIX_ARCH.length).trim();
  if (low.startsWith(PREFIX_FORMA)) return s.slice(PREFIX_FORMA.length).trim();
  return s;
}

function isTrattoAuraInnita(ab) {
  return (
    ab?.is_tratto_aura &&
    ab?.aura_riferimento &&
    String(ab.aura_riferimento.sigla || '').toUpperCase() === 'AIN'
  );
}

/** Punteggi caratteristica escludendo i contributi punteggio_acquisito delle abilità indicate */
function caratteristicheEscludendoAbilita(punteggiBase, punteggiList, abilitaPossedute, excludeIds) {
  const caNames = new Set((punteggiList || []).filter((p) => p.tipo === 'CA').map((p) => p.nome));
  const scores = {};
  for (const [k, v] of Object.entries(punteggiBase || {})) {
    if (caNames.has(k)) scores[k] = Number(v) || 0;
  }
  const excl = new Set(excludeIds || []);
  for (const ab of abilitaPossedute || []) {
    if (!ab?.id || !excl.has(ab.id)) continue;
    for (const link of ab.punteggi_assegnati || []) {
      const nom = link?.punteggio?.nome;
      if (nom && Object.prototype.hasOwnProperty.call(scores, nom)) {
        scores[nom] -= Number(link.valore) || 0;
      }
    }
  }
  return scores;
}

function idsTrattiInnatiSlot(abilitaPossedute, slot) {
  return (abilitaPossedute || [])
    .filter((ab) => {
      if (!isTrattoAuraInnita(ab)) return false;
      const liv = ab.livello_riferimento;
      if (slot === 'archetipo') return liv === 0 || liv === 1;
      if (slot === 'forma') return liv === 2;
      return false;
    })
    .map((ab) => ab.id);
}

export function useRazzaDisplay(abilitaPossedute) {
  return useMemo(() => {
    const arch = (abilitaPossedute || []).find(
      (ab) => isTrattoAuraInnita(ab) && (ab.livello_riferimento === 0 || ab.livello_riferimento === 1)
    );
    const forma = (abilitaPossedute || []).find((ab) => isTrattoAuraInnita(ab) && ab.livello_riferimento === 2);
    const archetipoLabel = arch ? stripRazzaPrefix(arch.nome) : 'Umano';
    const formaLabel = forma ? stripRazzaPrefix(forma.nome) : null;
    return { archetipoLabel, formaLabel, archetipoTrait: arch, formaTrait: forma };
  }, [abilitaPossedute]);
}

export function RazzaCollapsible({
  personaggioId,
  abilitaPossedute,
  punteggiBase,
  punteggiList,
  auraInnataRecord,
  onLogout,
  onUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  const ainVal = useMemo(() => {
    if (!auraInnataRecord?.nome || !punteggiBase) return 0;
    return Number(punteggiBase[auraInnataRecord.nome]) || 0;
  }, [auraInnataRecord, punteggiBase]);

  const tratti = auraInnataRecord?.tratti_disponibili || [];

  const archetipi = useMemo(() => {
    const list = tratti.filter((t) => t.livello_riferimento === 0 || t.livello_riferimento === 1);
    return [...list].sort((a, b) => {
      const la = a.livello_riferimento ?? 0;
      const lb = b.livello_riferimento ?? 0;
      if (la !== lb) return la - lb;
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'it');
    });
  }, [tratti]);
  const forme = useMemo(() => tratti.filter((t) => t.livello_riferimento === 2), [tratti]);

  const excludeArchIds = useMemo(() => idsTrattiInnatiSlot(abilitaPossedute, 'archetipo'), [abilitaPossedute]);
  const excludeFormIds = useMemo(() => idsTrattiInnatiSlot(abilitaPossedute, 'forma'), [abilitaPossedute]);

  const scoresArc = useMemo(
    () => caratteristicheEscludendoAbilita(punteggiBase, punteggiList, abilitaPossedute, excludeArchIds),
    [punteggiBase, punteggiList, abilitaPossedute, excludeArchIds]
  );
  const scoresForm = useMemo(
    () => caratteristicheEscludendoAbilita(punteggiBase, punteggiList, abilitaPossedute, excludeFormIds),
    [punteggiBase, punteggiList, abilitaPossedute, excludeFormIds]
  );

  const archetipoSelezionato = useMemo(
    () =>
      (abilitaPossedute || []).find(
        (ab) => isTrattoAuraInnita(ab) && (ab.livello_riferimento === 0 || ab.livello_riferimento === 1)
      ),
    [abilitaPossedute]
  );
  const formaSelezionata = useMemo(
    () => (abilitaPossedute || []).find((ab) => isTrattoAuraInnita(ab) && ab.livello_riferimento === 2),
    [abilitaPossedute]
  );

  const archetipoAbilitato = useCallback(
    (trait) => {
      const liv = trait.livello_riferimento;
      if (liv === 0) return ainVal >= 0;
      if (liv === 1) {
        if (ainVal < 1) return false;
        const nomeC = trait.caratteristica?.nome;
        if (!nomeC) return false;
        return (scoresArc[nomeC] || 0) >= 1;
      }
      return false;
    },
    [ainVal, scoresArc]
  );

  const formaAbilitata = useCallback(
    (trait) => {
      if (ainVal < 2) return false;
      const n1 = trait.caratteristica?.nome;
      const n2 = trait.caratteristica_2?.nome;
      if (!n1 || !n2) return false;
      const v1 = scoresForm[n1] || 0;
      const v2 = scoresForm[n2] || 0;
      if (n1 === n2) return v1 >= 2;
      return v1 >= 1 && v2 >= 1;
    },
    [ainVal, scoresForm]
  );

  const handlePick = async (trait) => {
    setError(null);
    setLoadingId(trait.id);
    try {
      await acquireAbilita(trait.id, personaggioId, onLogout);
      if (onUpdated) await onUpdated();
    } catch (e) {
      setError(e.message || 'Selezione non consentita.');
    } finally {
      setLoadingId(null);
    }
  };

  if (!auraInnataRecord) return null;

  return (
    <details
      className="mt-4 mb-6 bg-gray-800/80 rounded-lg border border-gray-700 shadow-inner group"
      open={open}
      onToggle={(e) => setOpen(e.target.open)}
    >
      <summary className="list-none flex items-center justify-between gap-2 p-3 cursor-pointer select-none text-lg font-semibold text-gray-200 hover:bg-gray-750 rounded-lg [&::-webkit-details-marker]:hidden">
        <span>Razza</span>
        <ChevronDown
          size={22}
          className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </summary>

      <div className="px-3 pb-4 pt-1 border-t border-gray-700 space-y-4">
        {error && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-md p-2">{error}</div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Archetipo</p>
          <p className="text-sm text-gray-300 mb-2">
            Attuale:{' '}
            <span className="text-amber-200 font-medium">
              {archetipoSelezionato ? stripRazzaPrefix(archetipoSelezionato.nome) : 'Umano'}
            </span>
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {archetipi.length === 0 && (
              <p className="text-xs text-gray-500">Nessun archetipo configurato sull&apos;aura innata.</p>
            )}
            {archetipi.map((trait) => {
              const ok = archetipoAbilitato(trait);
              const sel = archetipoSelezionato?.id === trait.id;
              const implicitUmano = !archetipoSelezionato && trait.livello_riferimento === 0;
              return (
                <button
                  key={trait.id}
                  type="button"
                  disabled={!ok || sel || implicitUmano || loadingId}
                  onClick={() => handlePick(trait)}
                  className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                    sel || implicitUmano
                      ? 'border-amber-600/50 bg-amber-950/20 text-amber-100'
                      : ok
                        ? 'border-gray-600 bg-gray-900 hover:border-gray-500 text-gray-200'
                        : 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium">{stripRazzaPrefix(trait.nome)}</span>
                  {loadingId === trait.id && <Loader2 className="inline ml-2 w-4 h-4 animate-spin align-middle" />}
                  {!ok && (
                    <span className="block text-[10px] text-gray-500 mt-0.5">Requisiti non soddisfatti</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {ainVal >= 2 && forme.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Forma</p>
            <p className="text-sm text-gray-300 mb-2">
              Attuale:{' '}
              <span className="text-cyan-200 font-medium">
                {formaSelezionata ? stripRazzaPrefix(formaSelezionata.nome) : 'Nessuna'}
              </span>
            </p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {forme.map((trait) => {
                const ok = formaAbilitata(trait);
                const sel = formaSelezionata?.id === trait.id;
                return (
                  <button
                    key={trait.id}
                    type="button"
                    disabled={!ok || sel || loadingId}
                    onClick={() => handlePick(trait)}
                    className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                      sel
                        ? 'border-cyan-600/50 bg-cyan-950/20 text-cyan-100'
                        : ok
                          ? 'border-gray-600 bg-gray-900 hover:border-gray-500 text-gray-200'
                          : 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-medium">{stripRazzaPrefix(trait.nome)}</span>
                    {loadingId === trait.id && <Loader2 className="inline ml-2 w-4 h-4 animate-spin align-middle" />}
                    {!ok && (
                      <span className="block text-[10px] text-gray-500 mt-0.5">Requisiti non soddisfatti</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export default RazzaCollapsible;
