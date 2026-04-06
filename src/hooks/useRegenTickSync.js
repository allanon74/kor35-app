import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applyOptimisticRegenTick } from '../utils/applyOptimisticRegenTick';

/**
 * Quando il countdown locale di una rigenerazione passa da >0 a 0, aggiorna subito la cache (ottimistico)
 * e riconcilia con il backend tramite refreshCharacterData.
 */
export function useRegenTickSync({ char, nowMs, refreshCharacterData }) {
  const queryClient = useQueryClient();
  const prevRef = useRef({});

  useEffect(() => {
    if (!char?.id) return;

    const charId = String(char.id);
    const triggered = [];
    const nextPrev = { ...prevRef.current };

    /** Le sigle gestite come pool hanno countdown in `risorse_pool_ui`: evita doppio tick con `rigenerazioni_auto_ui`. */
    const poolSigle = new Set((char.risorse_pool_ui || []).map((p) => p.sigla).filter(Boolean));

    const bump = (storeKey, left, sigla, step) => {
      if (!sigla) return;
      const prev = nextPrev[storeKey];
      if (prev !== undefined && prev > 0 && left === 0) {
        triggered.push({ sigla, step: Math.max(1, Number(step) || 1) });
      }
      nextPrev[storeKey] = left;
    };

    (char.rigenerazioni_auto_ui || []).forEach((r) => {
      if (poolSigle.has(r.sigla)) {
        nextPrev[`rig-${r.sigla}`] = -1;
        return;
      }
      if (r.paused || !r.active) {
        nextPrev[`rig-${r.sigla}`] = -1;
        return;
      }
      const t = r?.next_tick_at ? new Date(r.next_tick_at).getTime() : NaN;
      const left = Number.isFinite(t) ? Math.max(0, Math.ceil((t - nowMs) / 1000)) : 0;
      bump(`rig-${r.sigla}`, left, r.sigla, r.step);
    });

    (char.risorse_pool_ui || []).forEach((p) => {
      const rec = p?.recupero_auto || {};
      if (!rec.active) {
        nextPrev[`pool-${p.sigla}`] = -1;
        return;
      }
      const t = rec?.next_tick_at ? new Date(rec.next_tick_at).getTime() : NaN;
      const left = Number.isFinite(t) ? Math.max(0, Math.ceil((t - nowMs) / 1000)) : 0;
      bump(`pool-${p.sigla}`, left, p.sigla, rec.step);
    });

    prevRef.current = nextPrev;

    if (triggered.length === 0) return;

    const unique = [...new Map(triggered.map((t) => [t.sigla, t])).values()];

    queryClient.setQueryData(['personaggio', charId], (old) => {
      let next = old;
      for (const t of unique) {
        next = applyOptimisticRegenTick(next, t.sigla, t.step);
      }
      return next;
    });

    void refreshCharacterData?.();
  }, [nowMs, char, queryClient, refreshCharacterData]);
}
