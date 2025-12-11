import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAuthenticated,
  getPersonaggiList, 
  getPersonaggioDetail, 
  getAcquirableSkills, 
  getAcquirableInfusioni, 
  getAcquirableTessiture, 
  getPunteggiList,
  getPersonaggioLogs,       
  getPersonaggioTransazioni,
  getForgingQueue, 
  getShopItems,
  equipaggiaOggetto, 
  ricaricaOggetto, 
  assemblaOggetto, 
  smontaOggetto, 
  completeForging, 
} from '../api';

import { keepPreviousData } from '@tanstack/react-query'; 



// --- PUNTEGGI (Cache Globale Infinita) ---
export const usePunteggi = (onLogout) => {
  return useQuery({
    queryKey: ['punteggi'],
    queryFn: () => getPunteggiList(onLogout),
    staleTime: Infinity, // I punteggi non cambiano mai durante la sessione
    refetchOnWindowFocus: false,
  });
};

// --- LISTA PERSONAGGI ---
export const usePersonaggiList = (onLogout, viewAll) => {
  return useQuery({
    queryKey: ['personaggi_list', viewAll], // La chiave include i filtri
    queryFn: () => getPersonaggiList(onLogout, viewAll),
  });
};

// --- DETTAGLIO PERSONAGGIO ---
export const usePersonaggioDetail = (id, onLogout) => {
  return useQuery({
    queryKey: ['personaggio', id],
    queryFn: () => getPersonaggioDetail(id, onLogout),
    enabled: !!id, // Parte solo se c'è un ID
    staleTime: 1000 * 60 * 5, // 5 minuti di freschezza
  });
};

// --- ABILITÀ ACQUISTABILI ---
export const useAcquirableSkills = (id, onLogout) => {
  return useQuery({
    queryKey: ['abilita_acquistabili', id],
    queryFn: () => getAcquirableSkills(onLogout, id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// --- INFUSIONI ACQUISTABILI ---
export const useAcquirableInfusioni = (id) => {
  return useQuery({
    queryKey: ['infusioni_acquistabili', id],
    queryFn: () => getAcquirableInfusioni(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// --- TESSITURE ACQUISTABILI ---
export const useAcquirableTessiture = (id) => {
  return useQuery({
    queryKey: ['tessiture_acquistabili', id],
    queryFn: () => getAcquirableTessiture(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};



// ... Hook esistenti (usePunteggi, usePersonaggioDetail, etc.) ...

// --- HOOKS PER LOG E TRANSAZIONI PAGINATI ---

export const usePersonaggioLogs = (page = 1) => {
  return useQuery({
    queryKey: ['personaggio_logs', page],
    queryFn: () => getPersonaggioLogs(page),
    placeholderData: keepPreviousData, // Mantiene i dati vecchi finché i nuovi non arrivano (evita flickering)
    staleTime: 1000 * 60, // 1 minuto di cache
  });
};

export const useTransazioni = (page = 1, tipo = 'entrata', charId = null) => {
  return useQuery({
    queryKey: ['personaggio_transazioni', charId, tipo, page], // Aggiunto charId alla key
    queryFn: () => getPersonaggioTransazioni(page, tipo, charId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
    enabled: !!charId, // Evita la chiamata se non c'è un ID selezionato
  });
};

// --- CRAFTING QUEUE ---
export const useForgingQueue = (charId) => {
  return useQuery({
    queryKey: ['forging_queue', charId],
    queryFn: () => getForgingQueue(charId),
    enabled: !!charId,
    refetchInterval: 5000, // Aggiorna ogni 5 secondi per sicurezza
  });
};

// --- NEGOZIO ---
export const useShopItems = () => {
  return useQuery({
    queryKey: ['shop_items'],
    queryFn: getShopItems,
    staleTime: 1000 * 60 * 5, // Listino cacheato per 5 minuti
  });
};

// --- HELPER GENERICO PER OPTIMISTIC UI ---
// Riduce il codice ripetitivo per ogni azione
const useOptimisticAction = (queryKeyBase, mutationFn, updateFn) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFn,
    onMutate: async (variables) => {
      const charId = variables.charId || variables.personaggio_id; // Assicurati di passare sempre charId
      const queryKey = [...queryKeyBase, charId];

      // 1. Ferma refetch in corso
      await queryClient.cancelQueries({ queryKey });

      // 2. Salva stato precedente (Snapshot)
      const previousData = queryClient.getQueryData(queryKey);

      // 3. Aggiorna UI ottimisticamente
      queryClient.setQueryData(queryKey, (old) => {
          if (!old) return old;
          return updateFn(old, variables);
      });

      // Ritorna contesto per eventuale rollback
      return { previousData, queryKey };
    },
    onError: (err, newTodo, context) => {
      // 4. Rollback in caso di errore
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      console.error("Optimistic Update Failed:", err);
      alert("Errore sincronizzazione: " + err.message);
    },
    onSettled: (data, error, variables, context) => {
      // 5. Invalida per sicurezza (riscarica dati veri dal server)
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
};

// --- 1. CAMBIO STATISTICHE (HP, Mana, etc) ---
export const useOptimisticStatChange = () => {
    return useOptimisticAction(
        ['personaggio'], // Base Key
        // API Call
        async ({ charId, stat_sigla, mode }) => {
            return fetchAuthenticated('/personaggi/api/game/modifica_stat_temp/', {
                method: 'POST',
                body: JSON.stringify({ char_id: charId, stat_sigla, mode })
            });
        },
        // Optimistic Update Logic
        (oldData, { stat_sigla, mode }) => {
            return {
                ...oldData,
                statistiche_primarie: oldData.statistiche_primarie.map(stat => {
                    if (stat.sigla !== stat_sigla) return stat;
                    
                    let nuovoValore = stat.valore_corrente;
                    if (mode === 'consuma') nuovoValore = Math.max(0, stat.valore_corrente - 1);
                    else if (mode === 'reset') nuovoValore = stat.valore_max;
                    else if (mode === 'add') nuovoValore = Math.min(stat.valore_max, stat.valore_corrente + 1);

                    return { ...stat, valore_corrente: nuovoValore };
                })
            };
        }
    );
};

// --- 2. EQUIPAGGIA / DISEQUIPAGGIA ---
export const useOptimisticEquip = () => {
    return useOptimisticAction(
        ['personaggio'],
        ({ itemId, charId }) => equipaggiaOggetto(itemId, charId),
        (oldData, { itemId }) => {
            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => 
                    obj.id === itemId 
                    ? { ...obj, is_equipaggiato: !obj.is_equipaggiato } // Toggle immediato
                    : obj
                )
            };
        }
    );
};

// --- 3. USA OGGETTO (Consuma Carica) ---
export const useOptimisticUseItem = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ oggetto_id, charId }) => {
            return fetchAuthenticated('/personaggi/api/game/usa_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id, char_id: charId })
            });
        },
        (oldData, { oggetto_id }) => {
            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => {
                    if (obj.id !== oggetto_id) return obj;
                    // Decrementa carica
                    const nuoveCariche = Math.max(0, (obj.cariche_attuali || 0) - 1);
                    return { ...obj, cariche_attuali: nuoveCariche };
                })
            };
        }
    );
};

// --- 4. RICARICA OGGETTO ---
export const useOptimisticRecharge = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ oggetto_id, charId }) => { // Nota: charId serve per la chiave cache
             return fetchAuthenticated('/personaggi/api/game/ricarica_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id, char_id: charId })
            });
        },
        (oldData, { oggetto_id }) => {
            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => 
                    obj.id === oggetto_id 
                    ? { ...obj, cariche_attuali: obj.cariche_massime } // Ripristina max
                    : obj
                )
                // Nota: Non scalo i crediti ottimisticamente per semplicità, 
                // ma potresti farlo qui se hai `oldData.crediti`.
            };
        }
    );
};

// --- 5. ASSEMBLAGGIO (MONTA/SMONTA) ---
// Questo è complesso, facciamo una gestione semplificata
export const useOptimisticAssembly = (action) => {
    // action = 'monta' o 'smonta'
    return useOptimisticAction(
        ['personaggio'],
        async ({ host_id, mod_id, charId }) => {
             const apiFn = action === 'monta' ? assemblaOggetto : smontaOggetto;
             return apiFn(host_id, mod_id, charId);
        },
        (oldData, { host_id, mod_id }) => {
            // Qui la logica è complessa da replicare fedelmente (spostare oggetti tra array),
            // ma possiamo fare un trucco visivo:
            
            // Trova gli oggetti
            const hostIndex = oldData.oggetti.findIndex(o => o.id === host_id);
            if (hostIndex === -1) return oldData;
            
            const host = { ...oldData.oggetti[hostIndex] };
            let listaOggetti = [...oldData.oggetti];
            
            if (action === 'monta') {
                // Togli mod dalla lista principale, aggiungi a host.potenziamenti
                const mod = listaOggetti.find(o => o.id === mod_id);
                if (mod) {
                    listaOggetti = listaOggetti.filter(o => o.id !== mod_id);
                    host.potenziamenti_installati = [...(host.potenziamenti_installati || []), mod];
                }
            } else {
                // SMONTA: Togli da host.potenziamenti, aggiungi a lista principale
                const mod = host.potenziamenti_installati?.find(o => o.id === mod_id);
                if (mod) {
                    host.potenziamenti_installati = host.potenziamenti_installati.filter(o => o.id !== mod_id);
                    listaOggetti.push(mod);
                }
            }
            
            listaOggetti[hostIndex] = host; // Aggiorna host modificato
            return { ...oldData, oggetti: listaOggetti };
        }
    );
};

// --- 6. RITIRO FORGIATURA ---
export const useOptimisticForgingCollect = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ forgiaturaId, charId }) => completeForging(forgiaturaId, charId),
        onMutate: async ({ forgiaturaId, charId }) => {
             const queueKey = ['forging_queue', charId];
             const charKey = ['personaggio', charId];

             await queryClient.cancelQueries({ queryKey: queueKey });
             
             const prevQueue = queryClient.getQueryData(queueKey);

             // Aggiorna Coda: rimuovi l'oggetto che sto ritirando
             queryClient.setQueryData(queueKey, (old) => {
                 if (!old) return [];
                 return old.filter(item => item.id !== forgiaturaId);
             });
             
             // Nota: Non aggiungo l'oggetto all'inventario ottimisticamente perché
             // non ho ancora l'ID del nuovo oggetto creato. 
             // Mi limito a toglierlo dalla coda (feedback visivo "fatto").
             
             return { prevQueue, queueKey, charKey };
        },
        onError: (err, vars, ctx) => {
             if(ctx?.prevQueue) queryClient.setQueryData(ctx.queueKey, ctx.prevQueue);
             alert("Errore ritiro oggetto.");
        },
        onSettled: (data, err, vars, ctx) => {
             queryClient.invalidateQueries({ queryKey: ctx.queueKey });
             queryClient.invalidateQueries({ queryKey: ctx.charKey }); // Ricarica inventario
        }
    });
};