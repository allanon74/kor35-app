import { useState, useEffect } from 'react';

/**
 * Timestamp aggiornato ogni `intervalMs` (default 1s) per countdown derivati senza N interval locali.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Secondi rimanenti fino a una data ISO (ceil). */
export function secondsUntilIso(iso, nowMs = Date.now()) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - nowMs) / 1000));
}
