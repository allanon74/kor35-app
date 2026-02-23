export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://www.kor35.it';

/**
 * Helper generico per le chiamate API autenticate.
 * Gestisce l'header Authorization e il caso di token non valido.
 * @param {string} endpoint - L'endpoint API (es. /api/personaggi/api/personaggi/)
 * @param {object} options - Opzioni standard di fetch (method, body, etc.)
 * @param {function} onLogout - La funzione di logout da App.jsx
 */
export const fetchAuthenticated = async (endpoint, options = {}, onLogout) => {
  const token = localStorage.getItem('kor35_token');
  
  if (!token) {
    console.error('Nessun token trovato, logout in corso.');
    if (onLogout) onLogout();
    // NOTA: Restituire una Promise reietta è corretto qui
    return Promise.reject(new Error('Nessun token di autenticazione.'));
  }

  const headers = {
    // 'Content-Type': 'application/json', // Rimosso: vedi nota sotto
    'Authorization': `Token ${token}`,
    ...options.headers,
  };

  // Aggiungi Content-Type solo se il corpo non è FormData
  // (per gestire futuri upload di file)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body) {
    // Aggiungi solo se non c'è corpo (come nelle GET)
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      console.error('Token non valido o scaduto, logout in corso.');
      if (onLogout) onLogout();
      throw new Error('Autenticazione fallita.');
    }
    
    if (!response.ok) {
        // --- CORREZIONE: Gestione Errori "Body Stream" ---
        // Leggiamo la risposta come testo *una sola volta*.
        const errorText = await response.text();
        let errorMsg = errorText; // Default all'intero testo
        let errorData = null;
        
        try {
            // Proviamo a parsare il testo come JSON
            errorData = JSON.parse(errorText);
            // Se ci riusciamo, cerchiamo un messaggio di errore più pulito
            errorMsg = errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // Non era JSON, va bene. 'errorMsg' rimane l'HTML/testo
            // (es. la pagina 404 di Django)
        }
        
        // Ora lanciamo l'errore con status e data per gestione avanzata (es. 409 Conflict)
        console.error(`Errore API ${response.status} (${response.statusText}) per ${endpoint}:`, errorMsg);
        const error = new Error(`Errore API (${response.status}): ${errorMsg}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    if (response.status === 204) { // No Content
        return null;
    }

    return await response.json();
  
  } catch (error) {
    // Rimuoviamo il console.error qui perché lo gestiamo già sopra
    // in modo più pulito nel blocco !response.ok
    // console.error(`Errore durante il fetch a ${endpoint}:`, error);
    throw error;
  }
};


export const fetchPublic = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Public (${response.status}): ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Errore fetch public ${endpoint}:`, error);
    throw error;
  }
};

// --- Funzioni API specifiche ---

/**
 * Recupera la configurazione degli slot corporei (costanti).
 * Utile se vuoi popolarli dinamicamente, altrimenti usiamo costanti nel frontend.
 */
export const getBodySlots = () => {
  // Possiamo hardcodarlo nel frontend per semplicità o fare una chiamata
  return [
      { code: 'HD1', name: 'Testa 1 (Cervello/Occhi)' },
      { code: 'HD2', name: 'Testa 2 (Volto/Orecchie)' },
      { code: 'TR1', name: 'Tronco 1 (Cuore/Polmoni)' },
      { code: 'TR2', name: 'Tronco 2 (Spina Dorsale/Pelle)' },
      { code: 'RA', name: 'Braccio Destro' },
      { code: 'LA', name: 'Braccio Sinistro' },
      { code: 'RL', name: 'Gamba Destra' },
      { code: 'LL', name: 'Gamba Sinistra' },
  ];
};

/**
 * Recupera la lista dei personaggi associati all'utente.
 */
export const getPersonaggiList = (onLogout, viewAll = false) => {
  // Costruisci la query string se viewAll è true
  const queryParam = viewAll ? '?view_all=true' : '';
  
  return fetchAuthenticated(`/api/personaggi/api/personaggi/${queryParam}`, { method: 'GET' }, onLogout);
};

/**
 * Recupera i dettagli di un personaggio specifico.
 */
export const getPersonaggioDetail = (id, onLogout) => {
  return fetchAuthenticated(`/api/personaggi/api/personaggi/${id}/`, { method: 'GET' }, onLogout);
};

export const getQrCodeData = (qrId, onLogout) => {
  return fetchAuthenticated(`/api/personaggi/api/qrcode/${qrId}/`, { method: 'GET' }, onLogout);
};

/**
 * Richiede un oggetto da un inventario (azione "Prendi") - Sistema legacy
 */
export const richiediTransazione = (oggettoId, mittenteInventarioId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/transazioni/richiedi/', 
    {
      method: 'POST',
      body: JSON.stringify({
        oggetto_id: oggettoId,
        mittente_id: mittenteInventarioId,
      })
    },
    onLogout
  );
};

/**
 * Crea una nuova transazione avanzata con proposta iniziale
 */
export const createTransazioneAvanzata = (destinatarioId, proposta, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/transazioni/avanzata/',
    {
      method: 'POST',
      body: JSON.stringify({
        destinatario_id: destinatarioId,
        proposta: proposta
      })
    },
    onLogout
  );
};

/**
 * Recupera il dettaglio di una transazione con tutte le proposte
 */
export const getTransazioneDetail = (transazioneId, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/transazioni/${transazioneId}/`,
    { method: 'GET' },
    onLogout
  );
};

/**
 * Aggiunge una proposta (controproposta o rilancio) a una transazione
 */
export const addPropostaTransazione = (transazioneId, proposta, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/transazioni/${transazioneId}/proposta/`,
    {
      method: 'POST',
      body: JSON.stringify(proposta)
    },
    onLogout
  );
};

/**
 * Accetta o rifiuta una transazione
 */
export const confermaTransazione = (transazioneId, azione, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/transazioni/${transazioneId}/conferma/`,
    {
      method: 'POST',
      body: JSON.stringify({ azione: azione }) // 'accetta' o 'rifiuta'
    },
    onLogout
  );
};

/**
 * Tenta di rubare un oggetto da un personaggio (azione "Ruba").
 */
export const rubaOggetto = (oggettoId, targetPersonaggioId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/transazioni/ruba/', 
    {
      method: 'POST',
      body: JSON.stringify({
        oggetto_id: oggettoId,
        target_personaggio_id: targetPersonaggioId,
      })
    },
    onLogout
  );
};

/**
 * Acquisisce un oggetto/attivata da un QR code.
 */
export const acquisisciItem = (qrCodeId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/transazioni/acquisisci/', 
    {
      method: 'POST',
      body: JSON.stringify({
        qrcode_id: qrCodeId,
      })
    },
    onLogout
  );
};

/**
 * Recupera la lista master di tutte le abilità.
 * @deprecated Non più usata, sostituita da getAcquirableSkills e dati da getPersonaggioDetail
 */
export const getAbilitaMasterList = (onLogout) => {
  return fetchAuthenticated('/api/personaggi/api/abilita/master_list/', { method: 'GET' }, onLogout);
};

/**
 * Tenta di acquisire un'abilità per il personaggio loggato.
 */
export const acquireAbilita = (abilitaId, characterId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/personaggio/me/acquisisci_abilita/', 
    {
      method: 'POST',
      body: JSON.stringify({
        abilita_id: abilitaId,
        personaggio_id: characterId, // <-- NUOVO: Passa l'ID al backend
      })
    },
    onLogout
  );
};

/**
 * Recupera la lista di tutti i punteggi (Caratteristiche, Statistiche, ecc).
 */
export const getPunteggiList = (onLogout) => {
  return fetchAuthenticated('/api/personaggi/api/punteggi/all/', { method: 'GET' }, onLogout);
};


// --- MODIFICA CHIAVE ---
// Questa è la versione corretta della funzione che usa il tuo
// helper 'fetchAuthenticated' e l'URL corretto.
// Sostituisce la versione errata che ti avevo dato.

/**
 * Recupera la lista *filtrata* di abilità acquistabili per il personaggio.
 * GET /api/personaggi/api/personaggio/me/abilita_acquistabili/
 */
export const getAcquirableSkills = (onLogout, selectedCharacterId) => {
  // Aggiunge l'ID del personaggio come query parameter. Il backend dovrà leggere 'char_id'.
  const queryParam = selectedCharacterId ? `?char_id=${selectedCharacterId}` : '';
  
  return fetchAuthenticated(
    `/api/personaggi/api/personaggio/me/abilita_acquistabili/${queryParam}`, // <--- AGGIUNTO queryParam
    { method: 'GET' }, 
    onLogout
  );
};

/**
 * GET /api/personaggi/api/messaggi/ - Ottiene la lista dei messaggi per il PG loggato.
 */
export const getMessages = (personaggioId, onLogout) => {
  if (!personaggioId) {
    return Promise.resolve([]); // Ritorna un array vuoto se l'ID non è fornito
  }
  const url = `/api/personaggi/api/messaggi/?personaggio_id=${personaggioId}`;

  return fetchAuthenticated(url, { method: 'GET' }, onLogout);
};

/**
 * POST /api/personaggi/api/messaggi/broadcast/send/ - Invia un messaggio Broadcast.
 */
export const postBroadcastMessage = (messageData, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/messaggi/broadcast/send/',
    {
      method: 'POST',
      body: JSON.stringify(messageData)
    },
    onLogout
  );
};

/**
 * GET /api/personaggi/api/messaggi/admin/sent/ - Ottiene i messaggi inviati dall'admin.
 */
export const getAdminSentMessages = (onLogout) => {
  return fetchAuthenticated('/api/personaggi/api/messaggi/admin/sent/', { method: 'GET' }, onLogout);
};

export const saveWebPushSubscription = async (subscription, onLogout) => {
    const token = localStorage.getItem('kor35_token'); // O il nome chiave che usi tu
    
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/personaggi/api/webpush/subscribe/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}` // FONDAMENTALE: Invia l'identità dell'utente
        },
        body: JSON.stringify(subscription)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore server (${response.status}): ${errorText}`);
    }

    return await response.json();
};

// --- NUOVE FUNZIONI PER INFUSIONI E TESSITURE ---

/**
 * Recupera la lista delle infusioni acquistabili.
 */
export const getAcquirableInfusioni = (characterId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/personaggio/me/infusioni_acquistabili/?char_id=${characterId}`, 
    { method: 'GET' }
  );
};

/**
 * Acquisisce un'infusione.
 */
export const acquireInfusione = (infusioneId, personaggioId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/personaggio/me/acquisisci_infusione/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        infusione_id: infusioneId, 
        personaggio_id: personaggioId 
      }),
    }, 
    onLogout
  );
};

/**
 * Recupera la lista delle tessiture acquistabili.
 */
export const getAcquirableTessiture = (characterId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/personaggio/me/tessiture_acquistabili/?char_id=${characterId}`, 
    { method: 'GET' }
  );
};

/**
 * Acquisisce una tessitura.
 */
export const acquireTessitura = (tessituraId, personaggioId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/personaggio/me/acquisisci_tessitura/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        tessitura_id: tessituraId, 
        personaggio_id: personaggioId 
      }),
    }, 
    onLogout
  );
};

/**
 * Toggle favorite status di una tessitura.
 */
export const toggleTessituraFavorite = (tessituraId, personaggioId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/personaggio/me/toggle_tessitura_favorite/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        tessitura_id: tessituraId, 
        personaggio_id: personaggioId 
      }),
    }, 
    onLogout
  );
};

export const getModelliAura = (auraId) => {
  return fetchAuthenticated(`/api/personaggi/api/punteggio/${auraId}/modelli/`, { method: 'GET' });
};

export const selezionaModelloAura = (personaggioId, modelloId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/personaggio/me/seleziona_modello_aura/', 
    {
      method: 'POST',
      body: JSON.stringify({ personaggio_id: personaggioId, modello_id: modelloId })
    }, 
    onLogout
  );
};

export const getProposte = async (charId) => {
    // fetchAuthenticated restituisce già i dati, non la response raw.
    // L'errore viene gestito internamente a fetchAuthenticated.
    return await fetchAuthenticated(`/api/personaggi/api/proposte/?char_id=${charId}`, {
        method: 'GET'
    });
};

export const createProposta = async (data) => {
    return await fetchAuthenticated(`/api/personaggi/api/proposte/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateProposta = async (id, data) => {
    return await fetchAuthenticated(`/api/personaggi/api/proposte/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteProposta = async (id) => {
    // Qui fetchAuthenticated potrebbe tornare null (204 No Content), va bene così.
    await fetchAuthenticated(`/api/personaggi/api/proposte/${id}/`, {
        method: 'DELETE'
    });
    return true;
};

export const sendProposta = async (id) => {
    return await fetchAuthenticated(`/api/personaggi/api/proposte/${id}/invia_proposta/`, {
        method: 'POST'
    });
};

// --- UTILITIES PUNTEGGI ---

export const getAllPunteggi = async () => {
    // Assicurati che l'URL finisca con /all/ come definito in urls.py
    return await fetchAuthenticated(`/api/personaggi/api/punteggi/all/`, {
        method: 'GET'
    });
};

export const getMattoniAura = async (auraId) => {
    // Puntiamo all'endpoint corretto che restituisce i mattoni di quella specifica aura
    return await fetchAuthenticated(`/api/personaggi/api/punteggio/${auraId}/mattoni/`, {
        method: 'GET'
    });
};

export const getAdminPendingProposalsCount = (onLogout) => {
  return fetchAuthenticated('/api/personaggi/api/admin/pending_proposals_count/', { method: 'GET' }, onLogout);
};

export const markMessageAsRead = (messageId, characterId, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/messaggi/${messageId}/leggi/`,
    {
      method: 'POST',
      body: JSON.stringify({ personaggio_id: characterId })
    },
    onLogout
  );
};

/**
 * Cancella un messaggio (soft delete per l'utente).
 * POST /api/personaggi/api/messaggi/<id>/cancella/
 */
export const deleteMessage = (messageId, characterId, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/messaggi/${messageId}/cancella/`,
    {
      method: 'POST',
      body: JSON.stringify({ personaggio_id: characterId })
    },
    onLogout
  );
};

/**
 * Recupera i log paginati.
 * @param {number} page - Numero di pagina (default 1)
 */
export const getPersonaggioLogs = (page = 1) => {
  return fetchAuthenticated(`/api/personaggi/api/personaggio/me/logs/?page=${page}`, { method: 'GET' });
};

/**
 * Recupera le transazioni paginate.
 * @param {number} page - Numero di pagina
 * @param {string} tipo - 'entrata' o 'uscita'
 * @param {string} charId - ID del personaggio (opzionale)
 */
export const getPersonaggioTransazioni = (page = 1, tipo = 'entrata', charId = null) => {
  let url = `/api/personaggi/api/personaggio/me/transazioni/?page=${page}&tipo=${tipo}`;
  if (charId) {
    url += `&char_id=${charId}`;
  }
  return fetchAuthenticated(url, { method: 'GET' });
}
/**
 * Cerca personaggi per nome (Autocomplete)
 * Opzionalmente filtra per compatibilità con un'infusione (Innesto).
 */
export const searchPersonaggi = (query, currentCharacterId, infusioneId = null) => {
  let url = `/api/personaggi/api/personaggi/search/?q=${encodeURIComponent(query)}&current_char_id=${currentCharacterId}`;
  if (infusioneId) {
      url += `&infusione_id=${infusioneId}`;
  }
  return fetchAuthenticated(url, { method: 'GET' });
};

/**
 * Invia un messaggio privato
 */
export const sendPrivateMessage = (messageData, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/messaggi/send/',
    {
      method: 'POST',
      body: JSON.stringify(messageData)
    },
    onLogout
  );
};

// Crea un oggetto fisico a partire da un'infusione
export const craftOggetto = (infusioneId) => {
  return fetchAuthenticated('/api/personaggi/api/oggetti/craft/', {
    method: 'POST',
    body: JSON.stringify({ infusione_id: infusioneId })
  });
};

// // Monta un potenziamento (Mod/Materia) su un oggetto ospite
// export const montaPotenziamento = (ospiteId, potenziamentoId) => {
//   return fetchAuthenticated(`/api/personaggi/api/oggetti/${ospiteId}/monta/`, {
//     method: 'POST',
//     body: JSON.stringify({ potenziamento_id: potenziamentoId })
//   });
// };

// Smonta un potenziamento
export const smontaPotenziamento = (ospiteId, potenziamentoId) => {
  return fetchAuthenticated(`/api/personaggi/api/oggetti/${ospiteId}/smonta/`, {
    method: 'POST',
    body: JSON.stringify({ potenziamento_id: potenziamentoId })
  });
};

// Usa una carica (Mod, Innesti, Oggetti)
export const usaCarica = (oggettoId) => {
  return fetchAuthenticated(`/api/personaggi/api/oggetti/${oggettoId}/usa_carica/`, {
    method: 'POST'
  });
};

// Ricarica oggetto (pagando crediti)
export const ricaricaOggetto = (oggettoId) => {
  return fetchAuthenticated(`/api/personaggi/api/oggetti/${oggettoId}/ricarica/`, {
    method: 'POST'
  });
};

// --- API INVENTARIO & OGGETTI ---

/**
 * Recupera i dettagli di un oggetto tramite ID
 * GET /api/personaggi/api/oggetti/<id>/
 */
export const getOggettoDetail = (oggettoId, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/oggetti/${oggettoId}/`,
    { method: 'GET' },
    onLogout
  );
};

/**
 * Equipaggia o disequipaggia un oggetto fisico.
 * POST /api/personaggi/api/oggetti/equipaggia/
 */
export const equipaggiaOggetto = (itemId, characterId, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/oggetti/equipaggia/', 
    {
      method: 'POST',
      // Invia anche char_id nel JSON
      body: JSON.stringify({ 
          item_id: itemId,
          char_id: characterId 
      })
    },
    onLogout
  );
};

export const assemblaOggetto = (hostId, modId, characterId, useAcademy = false, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/oggetti/assembla/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        host_id: hostId, 
        mod_id: modId,
        char_id: characterId,
        use_academy: useAcademy // Parametro nuovo
      })
    },
    onLogout
  );
};

export const smontaOggetto = (hostId, modId, characterId, useAcademy = false, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/oggetti/smonta/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        host_id: hostId, 
        mod_id: modId,
        char_id: characterId,
        use_academy: useAcademy
      })
    },
    onLogout
  );
};

// Se hai bisogno del crafting nel frontend in futuro:
export const craftOggettoFromInfusione = (infusioneId, targetId, qrCode, onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/oggetti/craft/',
    {
      method: 'POST',
      body: JSON.stringify({
        infusione_id: infusioneId,
        target_id: targetId,
        qr_code: qrCode
      })
    },
    onLogout
  );
};

export const startForging = (infusioneId, charId, slotTarget = null) => {
  return fetchAuthenticated(
    '/api/personaggi/api/crafting/avvia_forgiatura/',
    {
      method: 'POST',
      body: JSON.stringify({ 
        infusione_id: infusioneId, 
        char_id: charId,
        slot_target: slotTarget
      })
    }
  );
};

export const completeForging = (forgiaturaId, charId) => {
  return fetchAuthenticated(
    '/api/personaggi/api/crafting/completa_forgiatura/',
    {
      method: 'POST',
      body: JSON.stringify({ 
        forgiatura_id: forgiaturaId, 
        char_id: charId 
      })
    }
  );
};

export const getForgingQueue = (charId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/crafting/coda_forgiatura/?char_id=${charId}`,
    { method: 'GET' }
  );
};

// --- API NEGOZIO (SHOP) ---

export const getShopItems = () => {
  return fetchAuthenticated(
    '/api/personaggi/api/negozio/listino/',
    { method: 'GET' }
  );
};

export const buyShopItem = (oggettoId, charId) => {
  return fetchAuthenticated(
    '/api/personaggi/api/negozio/acquista/',
    {
      method: 'POST',
      body: JSON.stringify({ 
        oggetto_id: oggettoId, 
        char_id: charId 
      })
    }
  );
};

/**
 * Valida la compatibilità e le competenze per un assemblaggio.
 */
export const validateAssembly = (charId, hostId, modId) => {
  return fetchAuthenticated(
    '/api/personaggi/api/assembly/validate/', 
    {
      method: 'POST',
      body: JSON.stringify({
        char_id: charId,
        host_id: hostId,
        mod_id: modId
      })
    }
  );
};

/**
 * Crea una richiesta di lavoro (Installazione o Rimozione).
 * @param {string} operationType - 'INST' (Default) o 'RIMO'
 */
export const createAssemblyRequest = (charId, hostId, modId, artisanName, offer, operationType = 'INST') => {
  return fetchAuthenticated(
    '/api/personaggi/api/richieste-assemblaggio/crea/', 
    {
      method: 'POST',
      body: JSON.stringify({
        committente_id: charId,
        host_id: hostId,
        comp_id: modId,
        artigiano_nome: artisanName,
        offerta: offer,
        tipo_operazione: operationType // <--- Passa il tipo al backend
      })
    }
  );
};

/**
 * Accetta una richiesta di assemblaggio (Lato Artigiano).
 */
export const acceptAssemblyRequest = (requestId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/richieste-assemblaggio/${requestId}/accetta/`, 
    { method: 'POST' }
  );
};

/**
 * Rifiuta una richiesta di assemblaggio (Lato Artigiano).
 */
export const rejectAssemblyRequest = (requestId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/richieste-assemblaggio/${requestId}/rifiuta/`, 
    { method: 'POST' }
  );
};

/**
 * Recupera le richieste di assemblaggio (inviate o ricevute).
 */
export const getAssemblyRequests = () => {
  return fetchAuthenticated(
    '/api/personaggi/api/richieste-assemblaggio/', 
    { method: 'GET' }
  );
};

// Aggiungi questa funzione per recuperare gli artigiani capaci
// Questa va bene per entrambi (Assemblaggio e Forgiatura)
export const getCapableArtisans = (charId, hostId, modId, infusioneId) => {
  return fetchAuthenticated('/api/personaggi/api/assembly/artisans/', {
      method: 'POST',
      body: JSON.stringify({ 
        char_id: charId, 
        host_id: hostId, 
        mod_id: modId, 
        infusione_id: infusioneId 
      })
  });
};

export const forgiaOggetto = (infusioneId, charId, useAcademy = false) => {
  return fetchAuthenticated('/api/personaggi/api/oggetti/forgia/', {
      method: 'POST',
      body: JSON.stringify({ 
        infusione_id: infusioneId, 
        char_id: charId, 
        use_academy: useAcademy 
      })
  });
};

export const createForgingRequest = (charId, infusioneId, artisanName, offer) => {
  return fetchAuthenticated('/api/personaggi/api/richieste-assemblaggio/crea/', {
      method: 'POST',
      body: JSON.stringify({
        committente_id: charId,
        infusione_id: infusioneId,
        artigiano_nome: artisanName,
        offerta: offer,
        tipo_operazione: 'FORG'
      })
  });
};

export const validateForging = (charId, infusioneId) => {
  return fetchAuthenticated('/api/personaggi/api/forging/validate/', {
      method: 'POST',
      body: JSON.stringify({ 
        char_id: charId, 
        infusione_id: infusioneId 
      })
  });
};

export const getClassiOggetto = () => {
  return fetchAuthenticated('/api/personaggi/api/classi_oggetto/', { method: 'GET' });
};

/**
 * Esegue l'installazione di un innesto da una forgiatura completata.
 * (Operazione "Fai da te" o "Accettazione diretta")
 */
export const installaInnesto = (forgiaturaId, slot, characterId, targetId = null) => {
  return fetchAuthenticated(
    '/api/personaggi/api/crafting/completa_forgiatura/', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        forgiatura_id: forgiaturaId, 
        char_id: characterId, // Chi esegue l'azione (Forgiatore)
        slot_scelto: slot,
        target_id: targetId   // NUOVO: Chi riceve l'innesto (Destinatario)
      })
    }
  );
}

/**
 * Crea una richiesta di operazione chirurgica a un altro giocatore.
 */
export const richiediOperazioneChirurgica = (forgiaturaId, slot, medicoNome, offerta, characterId) => {
  return fetchAuthenticated(
    '/api/personaggi/api/richieste-assemblaggio/crea/', 
    {
      method: 'POST',
      body: JSON.stringify({
        committente_id: characterId,
        forgiatura_id: forgiaturaId,
        slot_destinazione: slot,
        artigiano_nome: medicoNome,
        offerta: offerta,
        tipo_operazione: 'GRAF' // Codice per Graft/Innesto
      })
    }
  );
};

export const richiediAssemblaggio = (data) => {
  return fetchAuthenticated(
    '/api/personaggi/api/richieste-assemblaggio/crea/', 
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
};

/**
 * Rifiuta una richiesta (Wrapper per coerenza di naming).
 */
export const rifiutaRichiestaAssemblaggio = (requestId) => {
  return fetchAuthenticated(
    `/api/personaggi/api/richieste-assemblaggio/${requestId}/rifiuta/`, 
    { method: 'POST' }
  );
};

/**
 * Aggiorna parzialmente i dati del personaggio (es. impostazioni UI).
 */
export const updatePersonaggioSettings = (charId, settingsData, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/personaggi/${charId}/`, 
    {
      method: 'PATCH',
      body: JSON.stringify({ impostazioni_ui: settingsData })
    }, 
    onLogout
  );
};

// --- FUNZIONI CERIMONIALI ---

export const getAcquirableCerimoniali = (charId, onLogout) => {
    return fetchAuthenticated(
        `/api/personaggi/api/personaggio/me/cerimoniali_acquistabili/?char_id=${charId}`, 
        { method: 'GET' }, 
        onLogout
    );
}

// Modifica HP di un mostro in tempo reale
export const updateMostroHp = (mostroId, delta, onLogout) => {
  return fetchAuthenticated(
    `/api/plot/api/mostri-istanza/${mostroId}/modifica_hp/`,
    {
      method: 'POST',
      body: JSON.stringify({ delta })
    },
    onLogout
  );
};

// Associa un QR code scansionato a un oggetto "Vista" della quest
export const associaQrAVista = (vistaId, qrId, onLogout, force = false) => {
  return fetchAuthenticated(
    `/api/plot/api/viste-setup/${vistaId}/associa_qr/`,
    {
      method: 'POST',
      body: JSON.stringify({ qr_id: qrId, force: force })
    },
    onLogout
  );
};

// Associa QR direttamente a un elemento derivato da A_vista (Tessitura, Infusione, Cerimoniale, Oggetto, OggettoBase, Inventario)
export const associaQrDiretto = (aVistaId, qrId, onLogout, force = false) => {
  return fetchAuthenticated(
    `/api/personaggi/api/a-vista/${aVistaId}/associa-qr/`,
    {
      method: 'POST',
      body: JSON.stringify({ qr_id: qrId, force: force })
    },
    onLogout
  );
};

// --- EVENTI ---
export const getEventi = (onLogout) => fetchAuthenticated('/api/plot/api/eventi/', { method: 'GET' }, onLogout);
export const createEvento = (data, onLogout) => fetchAuthenticated('/api/plot/api/eventi/', { method: 'POST', body: JSON.stringify(data) }, onLogout);
export const updateEvento = (id, data, onLogout) => fetchAuthenticated(`/api/plot/api/eventi/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);
export const deleteEvento = (id, onLogout) => fetchAuthenticated(`/api/plot/api/eventi/${id}/`, { method: 'DELETE' }, onLogout);

// --- GIORNI ---
export const createGiorno = (data, onLogout) => fetchAuthenticated('/api/plot/api/giorni/', { method: 'POST', body: JSON.stringify(data) }, onLogout);
export const updateGiorno = (id, data, onLogout) => fetchAuthenticated(`/api/plot/api/giorni/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);
export const deleteGiorno = (id, onLogout) => fetchAuthenticated(`/api/plot/api/giorni/${id}/`, { method: 'DELETE' }, onLogout);

// --- QUESTS ---
export const createQuest = (data, onLogout) => fetchAuthenticated('/api/plot/api/quests/', { method: 'POST', body: JSON.stringify(data) }, onLogout);
export const updateQuest = (id, data, onLogout) => fetchAuthenticated(`/api/plot/api/quests/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);
export const deleteQuest = (id, onLogout) => fetchAuthenticated(`/api/plot/api/quests/${id}/`, { method: 'DELETE' }, onLogout);

// Recupera tutte le liste per i dropdown dell'editor
export const getRisorseEditor = (onLogout) => fetchAuthenticated('/api/plot/api/eventi/risorse_editor/', { method: 'GET' }, onLogout);
export const getAVistaDisponibili = (onLogout) => fetchAuthenticated('/api/plot/api/eventi/a_vista_disponibili/', { method: 'GET' }, onLogout);

// Operazioni su PnG, Mostri e Viste
// export const addPngToQuest = (data, onLogout) => fetchAuthenticated('/api/plot/api/png-assegnati/', { method: 'POST', body: JSON.stringify(data) }, onLogout);
// export const addMostroToQuest = (data, onLogout) => fetchAuthenticated('/api/plot/api/mostri-istanza/', { method: 'POST', body: JSON.stringify(data) }, onLogout);
// export const addVistaToQuest = (data, onLogout) => fetchAuthenticated('/api/plot/api/viste-setup/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const removePngFromQuest = (id, onLogout) => fetchAuthenticated(`/api/plot/api/png-assegnati/${id}/`, { method: 'DELETE' }, onLogout);
export const removeMostroFromQuest = (id, onLogout) => fetchAuthenticated(`/api/plot/api/mostri-istanza/${id}/`, { method: 'DELETE' }, onLogout);
export const removeVistaFromQuest = (id, onLogout) => fetchAuthenticated(`/api/plot/api/viste-setup/${id}/`, { method: 'DELETE' }, onLogout);

export const addPngToQuest = (questId, personaggioId, stafferId, onLogout) => {
    const payload = {
        quest: parseInt(questId),
        personaggio: parseInt(personaggioId),
        staffer: stafferId ? parseInt(stafferId) : null
    };
    return fetchAuthenticated('/api/plot/api/png-assegnati/', { method: 'POST', body: JSON.stringify(payload) }, onLogout);
};

// Correzione Mostri
export const addMostroToQuest = (questId, templateId, stafferId, onLogout) => {
    const payload = {
        quest: parseInt(questId),
        template: parseInt(templateId),
        staffer: stafferId ? parseInt(stafferId) : null
    };
    return fetchAuthenticated('/api/plot/api/mostri-istanza/', { method: 'POST', body: JSON.stringify(payload) }, onLogout);
};

// Correzione Viste: accetta l'oggetto vistaPayload
export const addVistaToQuest = (questId, data, onLogout) => {
    const payload = {
        quest: parseInt(questId),
        tipo: data.tipo,
        a_vista_id: parseInt(data.a_vista_id)
    };
    return fetchAuthenticated('/api/plot/api/viste-setup/', { method: 'POST', body: JSON.stringify(payload) }, onLogout);
};

/** --- STRUMENTI MASTER --- **/

// Recupera la lista di tutte le statistiche definite nel sistema
export const getStatisticheList = (onLogout) => {
  return fetchAuthenticated('/api/personaggi/api/statistiche/', { method: 'GET' }, onLogout);
};

// --- INFUSIONI ---
export const staffGetInfusioni = (onLogout, params = {}) => {
  // Costruiamo la query string (es: ?page=1&search=pippo)
  const queryString = new URLSearchParams(params).toString();
  return fetchAuthenticated(`/api/personaggi/api/staff/infusioni/?${queryString}`, { method: 'GET' }, onLogout);
};

export const staffCreateInfusione = (data, onLogout) => 
  fetchAuthenticated('/api/personaggi/api/staff/infusioni/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateInfusione = (id, data, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/infusioni/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);

export const staffDeleteInfusione = (id, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/infusioni/${id}/`, { method: 'DELETE' }, onLogout);

// --- TESSITURE ---
export const staffGetTessiture = (onLogout, params = {}) => {
  // Costruiamo la query string (es: ?page=1&search=pippo)
  const queryString = new URLSearchParams(params).toString();
  return fetchAuthenticated(`/api/personaggi/api/staff/tessiture/?${queryString}`, { method: 'GET' }, onLogout);
};

export const staffCreateTessitura = (data, onLogout) => 
  fetchAuthenticated('/api/personaggi/api/staff/tessiture/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateTessitura = (id, data, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/tessiture/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);

export const staffDeleteTessitura = (id, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/tessiture/${id}/`, { method: 'DELETE' }, onLogout);

// --- CERIMONIALI ---
export const staffGetCerimoniali = (onLogout, params = {}) => {
  // Costruiamo la query string (es: ?page=1&search=pippo)
  const queryString = new URLSearchParams(params).toString();
  return fetchAuthenticated(`/api/personaggi/api/staff/cerimoniali/?${queryString}`, { method: 'GET' }, onLogout);
};

export const staffCreateCerimoniale = (data, onLogout) => 
  fetchAuthenticated('/api/personaggi/api/staff/cerimoniali/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateCerimoniale = (id, data, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/cerimoniali/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);

export const staffDeleteCerimoniale = (id, onLogout) => 
  fetchAuthenticated(`/api/personaggi/api/staff/cerimoniali/${id}/`, { method: 'DELETE' }, onLogout);

// Gestione Oggetti (Istanze)
export const staffGetOggetti = (onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/oggetti/', { method: 'GET' }, onLogout);

export const staffCreateOggetto = (data, onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/oggetti/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateOggetto = (id, data, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/oggetti/${id}/`, { method: 'PUT', body: JSON.stringify(data) }, onLogout);

export const staffDeleteOggetto = (id, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/oggetti/${id}/`, { method: 'DELETE' }, onLogout);

// Gestione Oggetti Base (Listino/Template)
export const staffGetOggettiBase = (onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/oggetti-base/', { method: 'GET' }, onLogout);

export const staffCreateOggettoBase = (data, onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/oggetti-base/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateOggettoBase = (id, data, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/oggetti-base/${id}/`, { method: 'PUT', body: JSON.stringify(data) }, onLogout);

export const staffDeleteOggettoBase = (id, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/oggetti-base/${id}/`, { method: 'DELETE' }, onLogout);

// Utility
export const staffGetClassiOggetto = (onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/classi-oggetto/', { method: 'GET' }, onLogout);

// --- GESTIONE INVENTARI (Staff) ---
export const staffGetInventari = (onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/inventari/', { method: 'GET' }, onLogout);

export const staffCreateInventario = (data, onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/inventari/', { method: 'POST', body: JSON.stringify(data) }, onLogout);

export const staffUpdateInventario = (id, data, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/inventari/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);

export const staffDeleteInventario = (id, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/inventari/${id}/`, { method: 'DELETE' }, onLogout);

export const staffGetInventarioOggetti = (inventarioId, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/inventari/${inventarioId}/oggetti/`, { method: 'GET' }, onLogout);

export const staffAggiungiOggettoInventario = (inventarioId, oggettoId, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/inventari/${inventarioId}/aggiungi_oggetto/`, { 
        method: 'POST', 
        body: JSON.stringify({ oggetto_id: oggettoId }) 
    }, onLogout);

export const staffRimuoviOggettoInventario = (inventarioId, oggettoId, onLogout) => 
    fetchAuthenticated(`/api/personaggi/api/staff/inventari/${inventarioId}/rimuovi_oggetto/`, { 
        method: 'POST', 
        body: JSON.stringify({ oggetto_id: oggettoId }) 
    }, onLogout);

export const staffGetOggettiSenzaPosizione = (onLogout) => 
    fetchAuthenticated('/api/personaggi/api/staff/oggetti-senza-posizione/', { method: 'GET' }, onLogout);

// Sezione Personaggi

/**
 * Recupera le tipologie di personaggio disponibili.
 * Tenta di scaricarle dal server. Se fallisce o l'endpoint non esiste,
 * usa i valori di fallback per non rompere l'interfaccia.
 */
export const getTipologiePersonaggio = async (onLogout) => {
    try {
        // Tenta la chiamata all'API reale
        // Assicurati che nel backend esista: router.register(r'tipologie', TipologiaPersonaggioViewSet)
        const data = await fetchAuthenticated('/api/personaggi/api/tipologiepersonaggio/', { method: 'GET' }, onLogout);
        return data;
    } catch (error) {
        console.warn("API Tipologie non raggiungibile, uso fallback locale:", error);
        
        // Fallback locale nel caso il backend non sia ancora pronto
        return [
            { id: 1, label: 'Standard (Giocatore)' },
            { id: 2, label: 'PnG (Personaggio Non Giocante)' }
        ];
    }
};

// --- CRUD PERSONAGGI (Nuovo Endpoint) ---

export const getPersonaggiEditList = (onLogout, viewAll = false) => {
    // Nota: gestione-personaggi restituisce già la lista filtrata o completa in base all'utente/staff
    // Se vuoi forzare viewAll lato server potresti dover gestire i permessi, 
    // ma il get_queryset sopra lo fa già in automatico basandosi su is_staff.
    return fetchAuthenticated('/api/personaggi/api/gestione-personaggi/', { method: 'GET' }, onLogout);
};

export const createPersonaggio = (data, onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/gestione-personaggi/', {
        method: 'POST',
        body: JSON.stringify(data)
    }, onLogout);
};

export const updatePersonaggio = (id, data, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/gestione-personaggi/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }, onLogout);
};

// --- STAFF RESOURCES ---
export const staffAddResources = (charId, tipo, amount, reason, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/gestione-personaggi/${charId}/add_resources/`, {
        method: 'POST',
        body: JSON.stringify({ tipo, amount, reason })
    }, onLogout);
};

/**
 * Recupera le proposte tecniche in stato VALUTAZIONE per lo staff.
 */
export const staffGetProposteInValutazione = (onLogout) => {
  return fetchAuthenticated(
    '/api/personaggi/api/staff/proposte/valutazione/', 
    { method: 'GET' }, 
    onLogout
  );
};

/**
 * Rifiuta una proposta tecnica, riportandola in BOZZA e inviando un messaggio.
 */
export const staffRifiutaProposta = (propostaId, noteStaff, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/staff/proposte/${propostaId}/rifiuta/`,
    {
      method: 'POST',
      body: JSON.stringify({ note_staff: noteStaff })
    },
    onLogout
  );
};

/**
 * Approva una proposta: crea la tecnica finale, scala i crediti e aggiorna lo stato.
 * 'finalData' contiene i dati definitivi compilati tramite l'editor (Infusione/Tessitura/Cerimoniale).
 */
export const staffApprovaProposta = (propostaId, finalData, onLogout) => {
  return fetchAuthenticated(
    `/api/personaggi/api/staff/proposta/${propostaId}/approva/`,
    {
      method: 'POST',
      body: JSON.stringify(finalData)
    },
    onLogout
  );
};

// --- GESTIONE MOSTRI (TEMPLATE) ---

export const staffGetMostriTemplates = (onLogout) => {
    return fetchAuthenticated('/api/plot/api/staff/mostri-templates/', { method: 'GET' }, onLogout);
};

export const staffCreateMostroTemplate = (data, onLogout) => {
    return fetchAuthenticated('/api/plot/api/staff/mostri-templates/', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }, onLogout);
};

export const staffUpdateMostroTemplate = (id, data, onLogout) => {
    return fetchAuthenticated(`/api/plot/api/staff/mostri-templates/${id}/`, { 
        method: 'PUT', // Usa PUT per sostituire l'intero oggetto inclusi gli attacchi
        body: JSON.stringify(data) 
    }, onLogout);
};

export const staffDeleteMostroTemplate = (id, onLogout) => {
    return fetchAuthenticated(`/api/plot/api/staff/mostri-templates/${id}/`, { method: 'DELETE' }, onLogout);
};

// --- GESTIONE ABILITÀ ---

export const staffGetAbilitaList = (onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/staff/abilita/', { method: 'GET' }, onLogout);
};

export const staffCreateAbilita = (data, onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/staff/abilita/', {
        method: 'POST',
        body: JSON.stringify(data)
    }, onLogout);
};

export const staffUpdateAbilita = (id, data, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/abilita/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }, onLogout);
};

export const staffDeleteAbilita = (id, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/abilita/${id}/`, { method: 'DELETE' }, onLogout);
};

// Utile per l'editor: serve la lista di tutte le abilità per i prerequisiti
export const getAbilitaOptions = (onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/abilita/', { method: 'GET' }, onLogout);
};

export const getTiersList = (onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/tier/', { method: 'GET' }, onLogout);
};

export const staffCreateOffGame = async (data, onLogout) => {
    return await fetchAuthenticated('/api/plot/api/staff/staff-offgame/', 'POST', data, onLogout);
};

export const staffDeleteOffGame = async (id, onLogout) => {
    return await fetchAuthenticated(`/api/plot/api/staff/staff-offgame/${id}/`, 'DELETE', null, onLogout);
};

// src/api.js - Aggiungi queste esportazioni
export const addFaseToQuest = (payload, onLogout) => fetchAuthenticated('/api/plot/api/fasi/', { method: 'POST', body: JSON.stringify(payload) }, onLogout);
export const removeFaseFromQuest = (id, onLogout) => fetchAuthenticated(`/api/plot/api/fasi/${id}/`, { method: 'DELETE' }, onLogout);
export const addTaskToFase = (payload, onLogout) => fetchAuthenticated('/api/plot/api/tasks/', { method: 'POST', body: JSON.stringify(payload) }, onLogout);
export const removeTaskFromFase = (id, onLogout) => fetchAuthenticated(`/api/plot/api/tasks/${id}/`, { method: 'DELETE' }, onLogout);
export const updateFase = (id, data, onLogout) => fetchAuthenticated(`/api/plot/api/fasi/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }, onLogout);



// --- WIKI PAGINE REGOLAMENTO ---

export const getWikiMenu = async () => {
  const token = localStorage.getItem('kor35_token');
  // Puntiamo all'endpoint "smart" definito nelle urlpatterns di gestione_plot/urls.py
  const endpoint = '/api/plot/api/wiki/menu/'; 

  if (token) {
    // Se c'è il token, usiamo fetchAuthenticated: il backend riconoscerà lo Staff 
    // e restituirà anche bozze e pagine riservate.
    return fetchAuthenticated(endpoint, { method: 'GET' });
  } else {
    // Se non c'è token, usiamo fetchPublic: il backend applicherà i filtri di sicurezza.
    return fetchPublic(endpoint);
  }
};

export const getWikiPage = async (slug) => {
  const token = localStorage.getItem('kor35_token');
  const endpoint = `/api/plot/api/wiki/pagina/${slug}/`;

  if (token) {
    return fetchAuthenticated(endpoint, { method: 'GET' });
  } else {
    return fetchPublic(endpoint);
  }
};


export const getWikiTable = (id) => {
  return fetchPublic(`/api/plot/api/public/wiki-tabelle/${id}/`);
};

export const getWikiAura = (id) => {
  return fetchPublic(`/api/plot/api/public/wiki-aure/${id}/`);
};

// --- AGGIUNTA PER WIDGET TIER ---
export const getWikiTier = (id) => {
  return fetchPublic(`/api/plot/api/public/wiki-tiers/${id}/`);
};

// Helper per avere la lista di tutti i Tier (per l'editor del Master)
export const getWikiTierList = () => {
  return fetchPublic('/api/plot/api/public/wiki-tiers/');
};

// --- WIDGET IMMAGINI WIKI ---
export const getWikiImage = (id) => {
  return fetchPublic(`/api/plot/api/public/wiki-immagini/${id}/`);
};

export const getWikiImageList = () => {
  return fetchPublic('/api/plot/api/public/wiki-immagini/');
};

// Crea una nuova immagine wiki (Staff) - Supporta FormData per immagini
export const createWikiImage = (formData, onLogout) => {
  return fetchAuthenticated('/api/plot/api/staff/wiki-immagini/', {
    method: 'POST',
    body: formData // fetchAuthenticated gestisce automaticamente il Content-Type per FormData
  }, onLogout);
};

// Aggiorna un'immagine wiki esistente (Staff) - Supporta FormData per immagini
// Usa PATCH per aggiornamenti parziali (non sovrascrive l'immagine se non viene passata)
export const updateWikiImage = (id, formData, onLogout) => {
  return fetchAuthenticated(`/api/plot/api/staff/wiki-immagini/${id}/`, {
    method: 'PATCH',
    body: formData
  }, onLogout);
};

// Elimina un'immagine wiki (Staff)
export const deleteWikiImage = (id, onLogout) => {
  return fetchAuthenticated(`/api/plot/api/staff/wiki-immagini/${id}/`, {
    method: 'DELETE'
  }, onLogout);
};

// --- WIDGET BUTTONS WIKI ---
export const getWidgetButtons = (id) => {
  return fetchPublic(`/api/plot/api/public/wiki-buttons/${id}/`);
};

export const getWidgetButtonsList = () => {
  return fetchPublic('/api/plot/api/public/wiki-buttons/');
};

// Crea un nuovo widget buttons (Staff)
export const createWidgetButtons = (data, onLogout) => {
  return fetchAuthenticated('/api/plot/api/staff/wiki-buttons/', {
    method: 'POST',
    body: JSON.stringify(data)
  }, onLogout);
};

// Aggiorna un widget buttons esistente (Staff)
export const updateWidgetButtons = (id, data, onLogout) => {
  return fetchAuthenticated(`/api/plot/api/staff/wiki-buttons/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }, onLogout);
};

// Elimina un widget buttons (Staff)
export const deleteWidgetButtons = (id, onLogout) => {
  return fetchAuthenticated(`/api/plot/api/staff/wiki-buttons/${id}/`, {
    method: 'DELETE'
  }, onLogout);
};

// Recupera la lista delle immagini wiki (Staff) - versione autenticata
export const staffGetWikiImages = (onLogout) => {
  return fetchAuthenticated('/api/plot/api/staff/wiki-immagini/', {
    method: 'GET'
  }, onLogout);
};

// --- EVENTI PUBBLICI ---
export const getEventiPubblici = () => {
  return fetchPublic('/api/plot/api/public/eventi/');
};

// --- CONFIGURAZIONE SITO ---
export const getConfigurazioneSito = () => {
  return fetchPublic('/api/plot/api/public/configurazione-sito/1/');
};

// --- LINK SOCIAL ---
export const getLinkSocial = () => {
  return fetchPublic('/api/plot/api/public/link-social/');
};

// Crea una nuova pagina (Staff) - Supporta FormData per immagini
export const createWikiPage = (formData, onLogout) => {
  return fetchAuthenticated('/api/plot/api/staff/pagine-regolamento/', {
    method: 'POST',
    body: formData // fetchAuthenticated gestisce automaticamente il Content-Type per FormData
  }, onLogout);
};

// Aggiorna una pagina esistente (Staff)
export const updateWikiPage = (id, formData, onLogout) => {
  return fetchAuthenticated(`/api/plot/api/staff/pagine-regolamento/${id}/`, {
    method: 'PUT',
    body: formData
  }, onLogout);
};

// --- GESTIONE TABELLE (TIER) ---

export const getTiers = (onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/staff/tiers/', { method: 'GET' }, onLogout);
};

export const createTier = (data, onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/staff/tiers/', {
        method: 'POST',
        body: JSON.stringify(data)
    }, onLogout);
};

export const updateTier = (id, data, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/tiers/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }, onLogout);
};

export const deleteTier = (id, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/tiers/${id}/`, {
        method: 'DELETE'
    }, onLogout);
};

export const getAllAbilitaSimple = (onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/staff/tiers/all_abilita/', { method: 'GET' }, onLogout);
};

export const updateTierAbilita = (tierId, abilitaList, onLogout) => {
    // abilitaList deve essere array di { abilita_id, ordine }
    return fetchAuthenticated(`/api/personaggi/api/staff/tiers/${tierId}/update_abilita_list/`, {
        method: 'POST',
        body: JSON.stringify({ abilita_list: abilitaList })
    }, onLogout);
};

// Helper per ottenere l'URL dell'immagine ottimizzata
// width = 0 ritorna l'originale
export const getWikiImageUrl = (slug, width = 0) => {
    // Nota: API_BASE_URL deve essere la root del backend (es. http://localhost:8000)
    // Se usi il proxy di Vite, potrebbe essere solo ''
    const baseUrl = API_BASE_URL; // Sostituisci con la tua URL vera o variabile env
    return `${baseUrl}/api/plot/api/wiki/image/${slug}/?w=${width}`;
};

// Funzione helper extra per le immagini "grezze" (es. se servono fuori dal resize)
export const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
}

/**
 * Registra un nuovo utente.
 */
export const registerUser = async (userData) => {
    // userData deve contenere: username, password, email, first_name, last_name
    return fetchPublic('/api/personaggi/api/user/register/', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

/**
 * Cambia la password dell'utente loggato.
 */
export const changePassword = async (oldPassword, newPassword, onLogout) => {
    return fetchAuthenticated('/api/personaggi/api/user/change-password/', {
        method: 'POST',
        body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
        })
    }, onLogout);
};

/**
 * Attiva un utente (Solo Staff).
 */
export const activateUser = async (userIdToActivate, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/activate-user/${userIdToActivate}/`, {
        method: 'POST'
    }, onLogout);
};

/**
 * Elimina un utente (Solo Staff).
 */
export const deleteUser = async (userIdToDelete, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/delete-user/${userIdToDelete}/`, {
        method: 'DELETE'
    }, onLogout);
};

/**
 * Recupera i messaggi indirizzati allo staff (is_staff_message=True)
 */
export const fetchStaffMessages = async (onLogout) => {
    // --- CORREZIONE: Usa l'endpoint specifico per lo staff invece di quello generico ---
    return fetchAuthenticated('/api/personaggi/api/staff/messages/', {
        method: 'GET'
    }, onLogout);
};

/**
 * Marca un messaggio staff come letto.
 */
export const markStaffMessageAsRead = async (messageId, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/messages/${messageId}/leggi/`, {
        method: 'POST'
    }, onLogout);
};

/**
 * Elimina un messaggio staff.
 */
export const deleteStaffMessage = async (messageId, onLogout) => {
    return fetchAuthenticated(`/api/personaggi/api/staff/messages/${messageId}/cancella/`, {
        method: 'POST'
    }, onLogout);
};

/**
 * Recupera conversazioni organizzate per thread.
 */
export const getConversazioni = async (personaggioId, onLogout) => {
    return fetchAuthenticated(
        `/api/personaggi/api/messaggi/conversazioni/?personaggio_id=${personaggioId}`,
        { method: 'GET' },
        onLogout
    );
};

/**
 * Risponde a un messaggio creando un thread.
 */
export const rispondiMessaggio = async (messaggioId, personaggioId, testo, titolo, onLogout) => {
    return fetchAuthenticated(
        `/api/personaggi/api/messaggi/${messaggioId}/rispondi/`,
        {
            method: 'POST',
            body: JSON.stringify({
                personaggio_id: personaggioId,
                testo,
                titolo
            })
        },
        onLogout
    );
};