/**
 * Consumabili in inventario: raggruppamento UI e slot COG.
 * Il backend espone già solo consumabili validi (utilizzi > 0, non scaduti): per il COG
 * basta controllare se la lista dall'API ha almeno un elemento.
 */

export function normalizzaScadenzaKey(dataScadenza) {
    return String(dataScadenza || '').slice(0, 10);
}

/**
 * Unisce righe con stesso nome (trim) e stessa data di scadenza (stesso giorno YYYY-MM-DD).
 * Somma utilizzi_rimanenti. `items` è l'elenco dei record API, ordinati per consumo (più vecchio prima).
 *
 * @param {Array<object>} consumabili
 * @returns {Array<{ key: string, nome: string, data_scadenza: string, utilizzi_rimanenti: number, items: object[] }>}
 */
export function raggruppaConsumabiliNomeScadenza(consumabili) {
    if (!Array.isArray(consumabili) || consumabili.length === 0) return [];

    const map = new Map();
    for (const c of consumabili) {
        const nomeKey = String(c.nome ?? '').trim();
        const sk = normalizzaScadenzaKey(c.data_scadenza);
        const key = `${nomeKey}\0${sk}`;
        if (!map.has(key)) {
            map.set(key, {
                key,
                nome: c.nome,
                data_scadenza: c.data_scadenza,
                utilizzi_rimanenti: 0,
                items: [],
            });
        }
        const g = map.get(key);
        g.utilizzi_rimanenti += Number(c.utilizzi_rimanenti ?? 0);
        g.items.push(c);
    }

    for (const g of map.values()) {
        g.items.sort((a, b) => {
            const ca = String(a.data_creazione || '');
            const cb = String(b.data_creazione || '');
            if (ca !== cb) return ca.localeCompare(cb);
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
    }

    return Array.from(map.values());
}

/** True se la lista dall'API personaggio include almeno un consumabile (regola slot COG +1). */
export function consumabiliApiOccupanoSlotCog(consumabili) {
    return Array.isArray(consumabili) && consumabili.length > 0;
}
