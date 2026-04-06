/**
 * Patch locale del payload personaggio dopo un tick di rigenerazione (prima della risposta API).
 */

function patchRigenerazioniRows(rows, sigla, cur, maxV, nextAt, step, intervalSec) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) =>
    r.sigla === sigla
      ? {
          ...r,
          valore_corrente: cur,
          valore_max: maxV || r.valore_max,
          next_tick_at: nextAt,
          seconds_to_next_tick: intervalSec,
          step: step || r.step,
          interval_seconds: intervalSec,
        }
      : r
  );
}

export function applyOptimisticRegenTick(oldData, siglaRaw, stepIn) {
  if (!oldData) return oldData;
  const sigla = (siglaRaw || '').toUpperCase();
  const step = Math.max(1, Number(stepIn) || 1);

  const pool = oldData.risorse_pool_ui?.find((p) => p.sigla === sigla);
  if (pool) {
    const rc = pool.recupero_auto || {};
    const maxV = pool.valore_max ?? 0;
    const cur = Math.min(maxV, (pool.valore_corrente || 0) + step);
    const intervalSec = Math.max(1, Number(rc.interval_seconds) || 60);
    const nextAt = new Date(Date.now() + intervalSec * 1000).toISOString();
    const pools = (oldData.risorse_pool_ui || []).map((p) =>
      p.sigla === sigla
        ? {
            ...p,
            valore_corrente: cur,
            recupero_auto: {
              ...rc,
              active: true,
              next_tick_at: nextAt,
              seconds_to_next_tick: intervalSec,
              step: rc.step ?? step,
              interval_seconds: intervalSec,
            },
          }
        : p
    );
    const risorse = { ...(oldData.risorse_consumabili || {}) };
    risorse[sigla] = cur;
    const rig = patchRigenerazioniRows(
      oldData.rigenerazioni_auto_ui,
      sigla,
      cur,
      maxV,
      nextAt,
      step,
      intervalSec
    );
    return { ...oldData, risorse_pool_ui: pools, risorse_consumabili: risorse, rigenerazioni_auto_ui: rig };
  }

  const row = (oldData.rigenerazioni_auto_ui || []).find((r) => r.sigla === sigla);
  const key = `${sigla}_CUR`;
  const temp = { ...(oldData.statistiche_temporanee || {}) };

  let maxV =
    row?.valore_max ??
    oldData.statistiche_primarie?.find((s) => s.sigla === sigla)?.valore_max ??
    0;
  // Allineato a Personaggio._max_valore_for_regen: il cap visivo è CHA anche se CHK nel JSON è basso.
  if (sigla === 'CHK') {
    const chaMax = oldData.statistiche_primarie?.find((s) => s.sigla === 'CHA')?.valore_max ?? 0;
    maxV = Math.max(maxV || 0, chaMax || 0);
  }

  const baseCur =
    temp[key] !== undefined && temp[key] !== null
      ? Number(temp[key])
      : maxV;
  const cur = Math.min(maxV || 999, baseCur + step);
  temp[key] = cur;

  const intervalSec = Math.max(1, Number(row?.interval_seconds) || 60);
  const nextAt = new Date(Date.now() + intervalSec * 1000).toISOString();
  const rig = patchRigenerazioniRows(
    oldData.rigenerazioni_auto_ui,
    sigla,
    cur,
    maxV,
    nextAt,
    step,
    intervalSec
  );

  const primaries = (oldData.statistiche_primarie || []).map((st) => {
    if (st.sigla === sigla) return { ...st, valore_corrente: cur };
    return st;
  });

  return {
    ...oldData,
    statistiche_temporanee: temp,
    statistiche_primarie: primaries,
    rigenerazioni_auto_ui: rig,
  };
}
