import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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

/**
 * Un solo record per nome visualizzato (evita doppi "Umano" da duplicati in DB o livelli diversi).
 */
function dedupeArchetipiPerNomeVisualizzato(list, selectedId) {
  const byKey = new Map();
  const score = (t) => {
    let s = 0;
    if (selectedId && t.id === selectedId) s += 100;
    if (t.livello_riferimento === 0) s += 10;
    return s;
  };
  for (const t of list) {
    const key = stripRazzaPrefix(t.nome).toLowerCase().trim() || String(t.id);
    const cur = byKey.get(key);
    if (!cur || score(t) > score(cur)) byKey.set(key, t);
  }
  return Array.from(byKey.values());
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

/** Riga nome + descrizione HTML (stessa resa per archetipo e forma) */
function TraitOptionRow({ nomeDisplay, descrizione, selected, accent }) {
  const borderSelected =
    accent === 'forma' ? 'border-cyan-600/50 bg-cyan-950/20' : 'border-amber-600/50 bg-amber-950/20';
  const textSelected = accent === 'forma' ? 'text-cyan-100' : 'text-amber-100';

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-left text-sm px-3 py-2 rounded-md border ${
        selected ? `${borderSelected} ${textSelected}` : 'border-gray-600 bg-gray-900 text-gray-200'
      }`}
    >
      <span className="font-medium shrink-0">{nomeDisplay}</span>
      {descrizione ? (
        <span
          className="text-gray-400 text-sm prose prose-invert prose-sm max-w-none leading-snug [&_p]:inline [&_p]:my-0 [&_ul]:inline [&_ol]:inline"
          dangerouslySetInnerHTML={{ __html: descrizione }}
        />
      ) : null}
    </div>
  );
}

export function RazzaModal({
  isOpen,
  onClose,
  personaggioId,
  abilitaPossedute,
  punteggiBase,
  punteggiList,
  auraInnataRecord,
  onLogout,
  onUpdated,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoadingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loadingId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loadingId, onClose]);

  const ainVal = useMemo(() => {
    if (!auraInnataRecord?.nome || !punteggiBase) return 0;
    return Number(punteggiBase[auraInnataRecord.nome]) || 0;
  }, [auraInnataRecord, punteggiBase]);

  const tratti = auraInnataRecord?.tratti_disponibili || [];

  const archetipiAll = useMemo(() => {
    const list = tratti.filter((t) => t.livello_riferimento === 0 || t.livello_riferimento === 1);
    return [...list].sort((a, b) => {
      const la = a.livello_riferimento ?? 0;
      const lb = b.livello_riferimento ?? 0;
      if (la !== lb) return la - lb;
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'it');
    });
  }, [tratti]);

  const formeAll = useMemo(() => tratti.filter((t) => t.livello_riferimento === 2), [tratti]);

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

  const archetipiVisibili = useMemo(() => {
    const deduped = dedupeArchetipiPerNomeVisualizzato(archetipiAll, archetipoSelezionato?.id);
    const selId = archetipoSelezionato?.id;
    return deduped
      .filter((t) => (selId && t.id === selId) || archetipoAbilitato(t))
      .sort((a, b) => {
        const la = a.livello_riferimento ?? 0;
        const lb = b.livello_riferimento ?? 0;
        if (la !== lb) return la - lb;
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'it');
      });
  }, [archetipiAll, archetipoSelezionato?.id, archetipoAbilitato]);

  const formeVisibili = useMemo(() => {
    const selId = formaSelezionata?.id;
    return formeAll
      .filter((t) => (selId && t.id === selId) || formaAbilitata(t))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'it'));
  }, [formeAll, formaSelezionata?.id, formaAbilitata]);

  /** Tratto catalogo Umano (liv.0), per descrizione quando il PG non ha riga DB archetipo */
  const traitUmanoCatalogo = useMemo(
    () =>
      archetipiAll.find(
        (t) =>
          t.livello_riferimento === 0 && stripRazzaPrefix(t.nome).toLowerCase() === 'umano'
      ),
    [archetipiAll]
  );

  const archetipiAltri = useMemo(() => {
    return archetipiVisibili.filter((t) => {
      if (archetipoSelezionato?.id != null && String(t.id) === String(archetipoSelezionato.id))
        return false;
      if (!archetipoSelezionato) {
        const umanoL0 =
          t.livello_riferimento === 0 && stripRazzaPrefix(t.nome).toLowerCase() === 'umano';
        if (umanoL0) return false;
      }
      return true;
    });
  }, [archetipiVisibili, archetipoSelezionato]);

  const formeAltri = useMemo(() => {
    const sid = formaSelezionata?.id;
    return formeVisibili.filter((t) => sid == null || String(t.id) !== String(sid));
  }, [formeVisibili, formaSelezionata?.id]);

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

  if (!isOpen || !auraInnataRecord) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="razza-modal-title"
      onClick={(e) => e.target === e.currentTarget && !loadingId && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-xl shrink-0">
          <div>
            <h3 id="razza-modal-title" className="text-xl font-bold text-amber-400">
              Razza
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Archetipo:{' '}
              <span className="text-amber-200/90">
                {archetipoSelezionato ? stripRazzaPrefix(archetipoSelezionato.nome) : 'Umano'}
              </span>
              {ainVal >= 2 && (
                <>
                  {' '}
                  Forma:{' '}
                  <span className="text-cyan-200/90">
                    {formaSelezionata ? stripRazzaPrefix(formaSelezionata.nome) : 'Nessuna'}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={!!loadingId}
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="text-sm text-red-300 bg-red-900/50 border border-red-500/50 rounded-md p-2">{error}</div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Archetipo attuale</p>
            <div className="mb-4">
              {archetipoSelezionato ? (
                <TraitOptionRow
                  nomeDisplay={stripRazzaPrefix(archetipoSelezionato.nome)}
                  descrizione={archetipoSelezionato.descrizione}
                  selected
                  accent="archetipo"
                />
              ) : (
                <TraitOptionRow
                  nomeDisplay="Umano"
                  descrizione={traitUmanoCatalogo?.descrizione}
                  selected
                  accent="archetipo"
                />
              )}
            </div>

            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 border-t border-slate-700/80 pt-4">
              Altri archetipi
            </p>
            <div className="flex flex-col gap-2 max-h-[36vh] overflow-y-auto pr-1">
              {archetipiAltri.length === 0 ? (
                <p className="text-xs text-slate-500">Nessun altro archetipo selezionabile.</p>
              ) : (
                archetipiAltri.map((trait) => (
                  <button
                    key={trait.id}
                    type="button"
                    disabled={!!loadingId}
                    onClick={() => handlePick(trait)}
                    className="text-left rounded-md transition-colors w-full hover:brightness-110 cursor-pointer disabled:opacity-60"
                  >
                    <div className="relative">
                      <TraitOptionRow
                        nomeDisplay={stripRazzaPrefix(trait.nome)}
                        descrizione={trait.descrizione}
                        selected={false}
                        accent="archetipo"
                      />
                      {loadingId === trait.id && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {ainVal >= 2 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Forma attuale</p>
              <div className="mb-4">
                {formaSelezionata ? (
                  <TraitOptionRow
                    nomeDisplay={stripRazzaPrefix(formaSelezionata.nome)}
                    descrizione={formaSelezionata.descrizione}
                    selected
                    accent="forma"
                  />
                ) : (
                  <p className="text-sm text-slate-400 px-1 py-2 rounded-md border border-slate-700/60 bg-slate-900/40">
                    Nessuna forma selezionata.
                  </p>
                )}
              </div>

              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 border-t border-slate-700/80 pt-4">
                Altre forme
              </p>
              <div className="flex flex-col gap-2 max-h-[36vh] overflow-y-auto pr-1">
                {formeAltri.length === 0 ? (
                  <p className="text-xs text-slate-500">Non ci sono altre forme selezionabili.</p>
                ) : (
                  formeAltri.map((trait) => (
                    <button
                      key={trait.id}
                      type="button"
                      disabled={!!loadingId}
                      onClick={() => handlePick(trait)}
                      className="text-left rounded-md transition-colors w-full hover:brightness-110 cursor-pointer disabled:opacity-60"
                    >
                      <div className="relative">
                        <TraitOptionRow
                          nomeDisplay={stripRazzaPrefix(trait.nome)}
                          descrizione={trait.descrizione}
                          selected={false}
                          accent="forma"
                        />
                        {loadingId === trait.id && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-400" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RazzaModal;
