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
  fetchCacheRevision,
  equipaggiaOggetto,
  assemblaOggetto,
  smontaOggetto,
  completeForging,
  getAcquirableCerimoniali,
  acquireAbilita,
  acquireInfusione,
  acquireTessitura,
  revokeAbilita,
  revokeInfusione,
  revokeTessitura,
  revokeCerimoniale,
  toggleTessituraFavorite,
  buyShopItem,
  markMessageAsRead,
  deleteMessage,
} from '../api';
import { getRevision, setRevision } from '../queryRevisionStore';

/**
 * Se la revisione server coincide con l'ultima nota, riusa i dati in cache React Query
 * senza rifare il GET pesante.
 */
async function loadWithRevisionGate({ queryClient, queryKey, revisionPart, onLogout, fetchFull }) {
  let revMap;
  try {
    revMap = await fetchCacheRevision([revisionPart], onLogout);
  } catch {
    const data = await fetchFull();
    return data;
  }
  const serverRev = revMap[revisionPart];
  const cached = queryClient.getQueryData(queryKey);
  const prevRev = getRevision(revisionPart);
  if (cached != null && serverRev != null && prevRev === serverRev) {
    return cached;
  }
  const data = await fetchFull();
  if (serverRev != null) setRevision(revisionPart, serverRev);
  return data;
}

// --- HOOKS DI LETTURA (QUERY) ---

export const usePunteggi = (onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = 'punteggi_all';
  return useQuery({
    queryKey: ['punteggi'],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['punteggi'],
        revisionPart,
        onLogout,
        fetchFull: () => getPunteggiList(onLogout),
      }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const usePersonaggiList = (onLogout, viewAll) => {
  const queryClient = useQueryClient();
  const revisionPart = `personaggi_list:${viewAll ? '1' : '0'}`;
  return useQuery({
    queryKey: ['personaggi_list', viewAll],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['personaggi_list', viewAll],
        revisionPart,
        onLogout,
        fetchFull: () => getPersonaggiList(onLogout, viewAll),
      }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const usePersonaggioDetail = (id, onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = id ? `personaggio:${id}` : '';
  return useQuery({
    queryKey: ['personaggio', String(id)], 
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['personaggio', String(id)],
        revisionPart,
        onLogout,
        fetchFull: () => getPersonaggioDetail(id, onLogout),
      }),
    enabled: !!id, 
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useAcquirableSkills = (id, onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = id ? `personaggio:${id}` : '';
  return useQuery({
    queryKey: ['abilita_acquistabili', id],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['abilita_acquistabili', id],
        revisionPart,
        onLogout,
        fetchFull: () => getAcquirableSkills(onLogout, id),
      }),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useAcquirableInfusioni = (id, onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = id ? `personaggio:${id}` : '';
  return useQuery({
    queryKey: ['infusioni_acquistabili', id],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['infusioni_acquistabili', id],
        revisionPart,
        onLogout,
        fetchFull: () => getAcquirableInfusioni(id),
      }),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useAcquirableTessiture = (id, onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = id ? `personaggio:${id}` : '';
  return useQuery({
    queryKey: ['tessiture_acquistabili', id],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['tessiture_acquistabili', id],
        revisionPart,
        onLogout,
        fetchFull: () => getAcquirableTessiture(id),
      }),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useAcquirableCerimoniali = (id, onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = id ? `personaggio:${id}` : '';
  return useQuery({
    queryKey: ['cerimoniali_acquistabili', id],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['cerimoniali_acquistabili', id],
        revisionPart,
        onLogout,
        fetchFull: () => getAcquirableCerimoniali(id),
      }),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const usePersonaggioLogs = (page = 1) => {
  return useQuery({
    queryKey: ['personaggio_logs', page],
    queryFn: () => getPersonaggioLogs(page),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60, 
  });
};

export const useTransazioni = (page = 1, tipo = 'entrata', charId = null) => {
  return useQuery({
    queryKey: ['personaggio_transazioni', charId, tipo, page], 
    queryFn: () => getPersonaggioTransazioni(page, tipo, charId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
    enabled: !!charId, 
  });
};

export const useForgingQueue = (charId) => {
  return useQuery({
    queryKey: ['forging_queue', charId],
    queryFn: () => getForgingQueue(charId),
    enabled: !!charId,
    refetchInterval: 5000, 
  });
};

export const useShopItems = (onLogout) => {
  const queryClient = useQueryClient();
  const revisionPart = 'negozio_listino';
  return useQuery({
    queryKey: ['shop_items'],
    queryFn: () =>
      loadWithRevisionGate({
        queryClient,
        queryKey: ['shop_items'],
        revisionPart,
        onLogout,
        fetchFull: () => getShopItems(),
      }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

// --- HELPER OPTIMISTIC UI GENERALE ---
const useOptimisticAction = (queryKeyBase, mutationFn, updateFn) => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: mutationFn,
      onMutate: async (variables) => {
        const rawCharId = variables.charId || variables.personaggio_id; 
        const charId = String(rawCharId); 
        const queryKey = [...queryKeyBase, charId];
  
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData(queryKey);
  
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
        if (context?.previousData) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
        console.error("Optimistic Update Failed:", err);
      },
      onSettled: (data, error, variables, context) => {
        if (context?.queryKey) {
          queryClient.invalidateQueries({ queryKey: context.queryKey });
        }
      },
    });
};

// --- HOOKS DI SCRITTURA (OPTIMISTIC MUTATIONS) ---

// A. CAMBIO STATISTICHE (Esteso per Zone Corpo)
export const useOptimisticStatChange = () => {
    return useOptimisticAction(
        ['personaggio'], 
        async ({ charId, stat_sigla, mode, max_override }) => {
            return fetchAuthenticated('/api/personaggi/api/game/modifica_stat_temp/', {
                method: 'POST',
                // Passiamo max_override se presente (per zone corpo)
                body: JSON.stringify({ char_id: charId, stat_sigla, mode, max_value: max_override })
            });
        },
        (oldData, { stat_sigla, mode, max_override }) => {
            // Aggiorniamo statistiche_temporanee (la fonte di verità per i dati dinamici)
            const tempStats = { ...oldData.statistiche_temporanee };
            
            // Trova il valore corrente
            let val = tempStats[stat_sigla];
            
            // Se non esiste nel temp, cerchiamo il default nei primari o usiamo il max_override passato
            if (val === undefined) {
                if (max_override !== undefined) val = max_override;
                else {
                    const primaryStat = oldData.statistiche_primarie?.find(s => s.sigla === stat_sigla);
                    val = primaryStat ? primaryStat.valore_max : 0;
                }
            }

            // Determina il massimale per il clamp
            let maxVal = max_override;
            if (maxVal === undefined) {
                 const primaryStat = oldData.statistiche_primarie?.find(s => s.sigla === stat_sigla);
                 maxVal = primaryStat ? primaryStat.valore_max : 999;
            }

            // Calcolo
            if (mode === 'consuma') val = Math.max(0, val - 1);
            else if (mode === 'reset') val = maxVal;
            else if (mode === 'add') val = Math.min(maxVal, val + 1);

            // Scrittura aggiornata
            tempStats[stat_sigla] = val;

            // Aggiorna anche l'array statistiche_primarie per coerenza visuale se la stat è lì
            const updatedPrimaries = oldData.statistiche_primarie?.map(stat => {
                if (stat.sigla === stat_sigla) {
                    return { ...stat, valore_corrente: val };
                }
                return stat;
            });

            return {
                ...oldData,
                statistiche_temporanee: tempStats,
                statistiche_primarie: updatedPrimaries
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

// C. USA OGGETTO
export const useOptimisticUseItem = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ oggetto_id, charId }) => {
            return fetchAuthenticated('/api/personaggi/api/game/usa_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id, char_id: charId })
            });
        },
        (oldData, { oggetto_id, durata_totale, is_aura_zero_off }) => {
            if (!oldData.oggetti) return oldData;
            return {
                ...oldData,
                oggetti: oldData.oggetti.map(obj => {
                    if (obj.id !== oggetto_id) return obj;
                    const attuali = obj.cariche_attuali || 0;
                    const nuoveCariche = Math.max(0, (obj.cariche_attuali || 0) - 1);
                    let updates = { cariche_attuali: nuoveCariche };
                    if (durata_totale > 0) {
                        if (attuali > 0) { // Puoi attivare solo se avevi cariche
                            const now = new Date();
                            // Imposta la fine nel futuro
                            const endDate = new Date(now.getTime() + durata_totale * 1000);
                            updates.data_fine_attivazione = endDate.toISOString();
                            updates.is_active = true; // Diventa attivo
                        }
                    }
                    if (is_aura_zero_off && nuoveCariche === 0) {
                        updates.is_active = false;
                        updates.data_fine_attivazione = null; // Reset timer se si spegne forzatamente
                    }
                    return { ...obj, ...updates };
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
             return fetchAuthenticated('/api/personaggi/api/game/ricarica_oggetto/', {
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

// E. ASSEMBLAGGIO
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

// G. ACQUISTO ABILITÀ (Optimistic Update)
export const useOptimisticAcquireAbilita = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ abilitaId, charId }) => {
            return acquireAbilita(abilitaId, charId);
        },
        (oldData, { abilitaId }) => {
            if (!oldData) return oldData;
            // Rimuovi l'abilità dalla lista acquistabili e aggiungila a quelle possedute
            const abilita = oldData.abilita_acquistabili?.find(a => a.id === abilitaId);
            if (!abilita) return oldData;
            
            return {
                ...oldData,
                abilita_possedute: [...(oldData.abilita_possedute || []), abilita],
                abilita_acquistabili: (oldData.abilita_acquistabili || []).filter(a => a.id !== abilitaId),
                // Aggiorna crediti e PC se disponibili
                crediti: oldData.crediti - (abilita.costo_crediti_calc || 0),
                punti_caratteristica: oldData.punti_caratteristica - (abilita.costo_pc_calc || 0),
            };
        }
    );
};

// H. ACQUISTO INFUSIONE (Optimistic Update)
export const useOptimisticAcquireInfusione = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ infusioneId, charId }) => {
            return acquireInfusione(infusioneId, charId);
        },
        (oldData, { infusioneId }) => {
            if (!oldData) return oldData;
            const infusione = oldData.infusioni_acquistabili?.find(i => i.id === infusioneId);
            if (!infusione) return oldData;
            
            return {
                ...oldData,
                infusioni_possedute: [...(oldData.infusioni_possedute || []), infusione],
                infusioni_acquistabili: (oldData.infusioni_acquistabili || []).filter(i => i.id !== infusioneId),
                crediti: oldData.crediti - (infusione.costo_crediti_calc || 0),
                punti_caratteristica: oldData.punti_caratteristica - (infusione.costo_pc_calc || 0),
            };
        }
    );
};

// I. ACQUISTO TESSITURA (Optimistic Update)
export const useOptimisticAcquireTessitura = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ tessituraId, charId }) => {
            return acquireTessitura(tessituraId, charId);
        },
        (oldData, { tessituraId }) => {
            if (!oldData) return oldData;
            const tessitura = oldData.tessiture_acquistabili?.find(t => t.id === tessituraId);
            if (!tessitura) return oldData;
            
            return {
                ...oldData,
                tessiture_possedute: [...(oldData.tessiture_possedute || []), tessitura],
                tessiture_acquistabili: (oldData.tessiture_acquistabili || []).filter(t => t.id !== tessituraId),
                crediti: oldData.crediti - (tessitura.costo_crediti_calc || 0),
                punti_caratteristica: oldData.punti_caratteristica - (tessitura.costo_pc_calc || 0),
            };
        }
    );
};

// I-bis. TOGGLE FAVORITE TESSITURA (Optimistic Update)
export const useOptimisticToggleTessituraFavorite = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ tessituraId, charId }) => {
            return toggleTessituraFavorite(tessituraId, charId);
        },
        (oldData, { tessituraId }) => {
            if (!oldData || !oldData.tessiture_possedute) return oldData;
            
            return {
                ...oldData,
                tessiture_possedute: oldData.tessiture_possedute.map(t => 
                    t.id === tessituraId 
                        ? { ...t, is_favorite: !t.is_favorite }
                        : t
                )
            };
        }
    );
};

// J. ACQUISTO CERIMONIALE (Optimistic Update)
export const useOptimisticAcquireCerimoniale = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ cerimonialeId, charId, onLogout }) => {
            return fetchAuthenticated('/api/personaggi/api/personaggio/me/acquisisci_cerimoniale/', {
                method: 'POST',
                body: JSON.stringify({ personaggio_id: charId, cerimoniale_id: cerimonialeId })
            }, onLogout);
        },
        (oldData, { cerimonialeId }) => {
            if (!oldData) return oldData;
            const cerimoniale = oldData.cerimoniali_acquistabili?.find(c => c.id === cerimonialeId);
            if (!cerimoniale) return oldData;
            
            return {
                ...oldData,
                cerimoniali_posseduti: [...(oldData.cerimoniali_posseduti || []), cerimoniale],
                cerimoniali_acquistabili: (oldData.cerimoniali_acquistabili || []).filter(c => c.id !== cerimonialeId),
                crediti: oldData.crediti - (cerimoniale.costo_crediti || 0),
            };
        }
    );
};

// --- REVOCA ACQUISTI (NON ottimistici) ---
export const useRevokeAbilita = () => {
    return useMutation({
        mutationFn: ({ abilitaId, charId, onLogout }) => revokeAbilita(abilitaId, charId, onLogout),
    });
};

export const useRevokeInfusione = () => {
    return useMutation({
        mutationFn: ({ infusioneId, charId, onLogout }) => revokeInfusione(infusioneId, charId, onLogout),
    });
};

export const useRevokeTessitura = () => {
    return useMutation({
        mutationFn: ({ tessituraId, charId, onLogout }) => revokeTessitura(tessituraId, charId, onLogout),
    });
};

export const useRevokeCerimoniale = () => {
    return useMutation({
        mutationFn: ({ cerimonialeId, charId, onLogout }) => revokeCerimoniale(cerimonialeId, charId, onLogout),
    });
};

// K. ACQUISTO NEGOZIO (Optimistic Update)
export const useOptimisticBuyShopItem = () => {
    return useOptimisticAction(
        ['personaggio'],
        async ({ oggettoId, charId }) => {
            return buyShopItem(oggettoId, charId);
        },
        (oldData, { oggettoId, costo }) => {
            if (!oldData || !oldData.oggetti) return oldData;
            // Aggiungi l'oggetto all'inventario (il backend lo farà, qui simuliamo)
            return {
                ...oldData,
                crediti: oldData.crediti - (costo || 0),
                // L'oggetto verrà aggiunto dal backend dopo la risposta
            };
        }
    );
};

// L. MESSAGGI - MARK AS READ (Optimistic Update)
export const useOptimisticMarkMessageRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ messageId, charId, onLogout }) => {
            return markMessageAsRead(messageId, charId, onLogout);
        },
        onMutate: async ({ messageId }) => {
            // Non abbiamo una query key specifica per i messaggi nel context
            // ma possiamo aggiornare direttamente lo stato locale
            return { messageId };
        },
        onError: (err, vars, context) => {
            console.error("Errore mark as read:", err);
        },
    });
};

// M. MESSAGGI - DELETE (Optimistic Update)
export const useOptimisticDeleteMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ messageId, charId, onLogout }) => {
            return deleteMessage(messageId, charId, onLogout);
        },
        onMutate: async ({ messageId }) => {
            return { messageId };
        },
        onError: (err, vars, context) => {
            console.error("Errore delete message:", err);
        },
    });
};