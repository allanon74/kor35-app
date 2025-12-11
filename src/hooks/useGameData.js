import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query'; 
import { 
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
  fetchAuthenticated,
  equipaggiaOggetto,
  assemblaOggetto,
  smontaOggetto,
  completeForging
} from '../api';

// --- HOOKS DI LETTURA (QUERY) ---

// 1. Punteggi (Cache Globale Infinita)
export const usePunteggi = (onLogout) => {
  return useQuery({
    queryKey: ['punteggi'],
    queryFn: () => getPunteggiList(onLogout),
    staleTime: Infinity, 
    refetchOnWindowFocus: false,
  });
};

// 2. Lista Personaggi
export const usePersonaggiList = (onLogout, viewAll) => {
  return useQuery({
    queryKey: ['personaggi_list', viewAll],
    queryFn: () => getPersonaggiList(onLogout, viewAll),
  });
};

// 3. Dettaglio Personaggio
export const usePersonaggioDetail = (id, onLogout) => {
  return useQuery({
    queryKey: ['personaggio', String(id)], // Forziamo String anche qui per sicurezza
    queryFn: () => getPersonaggioDetail(id, onLogout),
    enabled: !!id, 
    staleTime: 1000 * 60 * 5, 
  });
};

// 4. Abilità Acquistabili
export const useAcquirableSkills = (id, onLogout) => {
  return useQuery({
    queryKey: ['abilita_acquistabili', id],
    queryFn: () => getAcquirableSkills(onLogout, id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// 5. Infusioni Acquistabili
export const useAcquirableInfusioni = (id) => {
  return useQuery({
    queryKey: ['infusioni_acquistabili', id],
    queryFn: () => getAcquirableInfusioni(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// 6. Tessiture Acquistabili
export const useAcquirableTessiture = (id) => {
  return useQuery({
    queryKey: ['tessiture_acquistabili', id],
    queryFn: () => getAcquirableTessiture(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// 7. Logs Paginati
export const usePersonaggioLogs = (page = 1) => {
  return useQuery({
    queryKey: ['personaggio_logs', page],
    queryFn: () => getPersonaggioLogs(page),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60, 
  });
};

// 8. Transazioni Paginati
export const useTransazioni = (page = 1, tipo = 'entrata', charId = null) => {
  return useQuery({
    queryKey: ['personaggio_transazioni', charId, tipo, page], 
    queryFn: () => getPersonaggioTransazioni(page, tipo, charId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
    enabled: !!charId, 
  });
};

// 9. Coda Forgiatura
export const useForgingQueue = (charId) => {
  return useQuery({
    queryKey: ['forging_queue', charId],
    queryFn: () => getForgingQueue(charId),
    enabled: !!charId,
    refetchInterval: 5000, 
  });
};

// 10. Negozio
export const useShopItems = () => {
  return useQuery({
    queryKey: ['shop_items'],
    queryFn: getShopItems,
    staleTime: 1000 * 60 * 5, 
  });
};

// --- HELPER OPTIMISTIC UI GENERALE ---
const useOptimisticAction = (queryKeyBase, mutationFn, updateFn) => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: mutationFn,
      onMutate: async (variables) => {
        // --- FIX CRUCIALE ---
        // Convertiamo l'ID in Stringa. Il Context usa stringhe (da localStorage),
        // mentre i componenti passano numeri (da API). Questa conversione allinea le chiavi.
        const rawCharId = variables.charId || variables.personaggio_id; 
        const charId = String(rawCharId); 
        
        const queryKey = [...queryKeyBase, charId];
  
        // 1. Blocca refetch in corso
        await queryClient.cancelQueries({ queryKey });
  
        // 2. Snapshot stato precedente
        const previousData = queryClient.getQueryData(queryKey);
  
        // 3. Aggiorna UI manualmente (Solo se i dati esistono in cache)
        if (previousData) {
            queryClient.setQueryData(queryKey, (old) => {
                if (!old) return old;
                try {
                    return updateFn(old, variables);
                } catch (e) {
                    console.error("Errore updateFn optimistic:", e);
                    return old;
                }
            });
        }
  
        return { previousData, queryKey };
      },
      onError: (err, newTodo, context) => {
        // 4. Rollback in caso di errore
        if (context?.previousData) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
        console.error("Optimistic Update Failed:", err);
        // Alert opzionale, utile per debug
        // alert("Sincronizzazione fallita: " + err.message); 
      },
      onSettled: (data, error, variables, context) => {
        // 5. Invalida per sicurezza (riscarica dati veri)
        if (context?.queryKey) {
          queryClient.invalidateQueries({ queryKey: context.queryKey });
        }
      },
    });
};

// --- HOOKS DI SCRITTURA (OPTIMISTIC MUTATIONS) ---

// A. CAMBIO STATISTICHE (HP, Mana, etc)
export const useOptimisticStatChange = () => {
    return useOptimisticAction(
        ['personaggio'], 
        async ({ charId, stat_sigla, mode }) => {
            return fetchAuthenticated('/personaggi/api/game/modifica_stat_temp/', {
                method: 'POST',
                body: JSON.stringify({ char_id: charId, stat_sigla, mode })
            });
        },
        (oldData, { stat_sigla, mode }) => {
            if (!oldData.statistiche_primarie) return oldData;
            
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

// B. EQUIPAGGIA / DISEQUIPAGGIA
export const useOptimisticEquip = () => {
    return useOptimisticAction(
        ['personaggio'],
        ({ itemId, charId }) => equipaggiaOggetto(itemId, charId),
        (oldData, { itemId }) => {
            if (!oldData.oggetti) return oldData;
            
            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => 
                    obj.id === itemId 
                    ? { ...obj, is_equipaggiato: !obj.is_equipaggiato } 
                    : obj
                )
            };
        }
    );
};

// C. USA OGGETTO (Consuma Carica)
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
            if (!oldData.oggetti) return oldData;

            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => {
                    if (obj.id !== oggetto_id) return obj;
                    const nuoveCariche = Math.max(0, (obj.cariche_attuali || 0) - 1);
                    return { ...obj, cariche_attuali: nuoveCariche };
                })
            };
        }
    );
};

// D. RICARICA OGGETTO
export const useOptimisticRecharge = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ oggetto_id, charId }) => {
             return fetchAuthenticated('/personaggi/api/game/ricarica_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id, char_id: charId })
            });
        },
        (oldData, { oggetto_id }) => {
            if (!oldData.oggetti) return oldData;

            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => 
                    obj.id === oggetto_id 
                    ? { ...obj, cariche_attuali: obj.cariche_massime } 
                    : obj
                )
            };
        }
    );
};

// E. ASSEMBLAGGIO (MONTA/SMONTA)
export const useOptimisticAssembly = (action) => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ host_id, mod_id, charId, useAcademy }) => {
             const apiFn = action === 'monta' ? assemblaOggetto : smontaOggetto;
             return apiFn(host_id, mod_id, charId, useAcademy);
        },
        (oldData, { host_id, mod_id }) => {
            if (!oldData.oggetti) return oldData;

            const hostIndex = oldData.oggetti.findIndex(o => o.id === host_id);
            if (hostIndex === -1) return oldData;
            
            const host = { ...oldData.oggetti[hostIndex] };
            let listaOggetti = [...oldData.oggetti];
            
            if (action === 'monta') {
                const mod = listaOggetti.find(o => o.id === mod_id);
                if (mod) {
                    listaOggetti = listaOggetti.filter(o => o.id !== mod_id);
                    host.potenziamenti_installati = [...(host.potenziamenti_installati || []), mod];
                }
            } else { 
                const mod = host.potenziamenti_installati?.find(o => o.id === mod_id);
                if (mod) {
                    host.potenziamenti_installati = host.potenziamenti_installati.filter(o => o.id !== mod_id);
                    listaOggetti.push({ ...mod, is_equipaggiato: false }); 
                }
            }
            
            listaOggetti[hostIndex] = host;
            return { ...oldData, oggetti: listaOggetti };
        }
    );
};

// F. RITIRO FORGIATURA
export const useOptimisticForgingCollect = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ forgiaturaId, charId }) => completeForging(forgiaturaId, charId),
        onMutate: async ({ forgiaturaId, charId }) => {
             // FIX: Conversione ID in stringa
             const cId = String(charId);
             
             const queueKey = ['forging_queue', cId];
             const charKey = ['personaggio', cId];

             await queryClient.cancelQueries({ queryKey: queueKey });
             
             const prevQueue = queryClient.getQueryData(queueKey);

             if (prevQueue) {
                queryClient.setQueryData(queueKey, (old) => {
                    if (!old) return [];
                    return old.filter(item => item.id !== forgiaturaId);
                });
             }
             
             return { prevQueue, queueKey, charKey };
        },
        onError: (err, vars, ctx) => {
             if(ctx?.prevQueue) queryClient.setQueryData(ctx.queueKey, ctx.prevQueue);
             alert("Errore ritiro oggetto: " + err.message);
        },
        onSettled: (data, err, vars, ctx) => {
             if(ctx) {
                 queryClient.invalidateQueries({ queryKey: ctx.queueKey });
                 queryClient.invalidateQueries({ queryKey: ctx.charKey });
             }
        }
    });
};