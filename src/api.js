export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://www.k-o-r-35.it';

/**
 * Helper generico per le chiamate API autenticate.
 * Gestisce l'header Authorization e il caso di token non valido.
 * @param {string} endpoint - L'endpoint API (es. /personaggi/api/personaggi/)
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
        
        try {
            // Proviamo a parsare il testo come JSON
            const errorData = JSON.parse(errorText);
            // Se ci riusciamo, cerchiamo un messaggio di errore più pulito
            errorMsg = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (e) {
            // Non era JSON, va bene. 'errorMsg' rimane l'HTML/testo
            // (es. la pagina 404 di Django)
        }
        
        // Ora lanciamo l'errore in modo pulito
        console.error(`Errore API ${response.status} (${response.statusText}) per ${endpoint}:`, errorMsg);
        throw new Error(`Errore API (${response.status}): ${errorMsg}`);
        // --- FINE CORREZIONE ---
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

// --- Funzioni API specifiche ---

/**
 * Recupera la lista dei personaggi associati all'utente.
 */
export const getPersonaggiList = (onLogout, viewAll = false) => {
  // Costruisci la query string se viewAll è true
  const queryParam = viewAll ? '?view_all=true' : '';
  
  return fetchAuthenticated(`/personaggi/api/personaggi/${queryParam}`, { method: 'GET' }, onLogout);
};

/**
 * Recupera i dettagli di un personaggio specifico.
 */
export const getPersonaggioDetail = (id, onLogout) => {
  return fetchAuthenticated(`/personaggi/api/personaggi/${id}/`, { method: 'GET' }, onLogout);
};

export const getQrCodeData = (qrId, onLogout) => {
  return fetchAuthenticated(`/personaggi/api/qrcode/${qrId}/`, { method: 'GET' }, onLogout);
};

/**
 * Richiede un oggetto da un inventario (azione "Prendi").
 */
export const richiediTransazione = (oggettoId, mittenteInventarioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/transazioni/richiedi/', 
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
 * Tenta di rubare un oggetto da un personaggio (azione "Ruba").
 */
export const rubaOggetto = (oggettoId, targetPersonaggioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/transazioni/ruba/', 
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
    '/personaggi/api/transazioni/acquisisci/', 
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
  return fetchAuthenticated('/personaggi/api/abilita/master_list/', { method: 'GET' }, onLogout);
};

/**
 * Tenta di acquisire un'abilità per il personaggio loggato.
 */
export const acquireAbilita = (abilitaId, characterId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/personaggio/me/acquisisci_abilita/', 
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
  return fetchAuthenticated('/personaggi/api/punteggi/all/', { method: 'GET' }, onLogout);
};


// --- MODIFICA CHIAVE ---
// Questa è la versione corretta della funzione che usa il tuo
// helper 'fetchAuthenticated' e l'URL corretto.
// Sostituisce la versione errata che ti avevo dato.

/**
 * Recupera la lista *filtrata* di abilità acquistabili per il personaggio.
 * GET /personaggi/api/personaggio/me/abilita_acquistabili/
 */
export const getAcquirableSkills = (onLogout, selectedCharacterId) => {
  // Aggiunge l'ID del personaggio come query parameter. Il backend dovrà leggere 'char_id'.
  const queryParam = selectedCharacterId ? `?char_id=${selectedCharacterId}` : '';
  
  return fetchAuthenticated(
    `/personaggi/api/personaggio/me/abilita_acquistabili/${queryParam}`, // <--- AGGIUNTO queryParam
    { method: 'GET' }, 
    onLogout
  );
};

/**
 * GET /personaggi/api/messaggi/ - Ottiene la lista dei messaggi per il PG loggato.
 */
export const getMessages = (personaggioId, onLogout) => {
  if (!personaggioId) {
    return Promise.resolve([]); // Ritorna un array vuoto se l'ID non è fornito
  }
  const url = `/personaggi/api/messaggi/?personaggio_id=${personaggioId}`;

  return fetchAuthenticated(url, { method: 'GET' }, onLogout);
};

/**
 * POST /personaggi/api/messaggi/broadcast/send/ - Invia un messaggio Broadcast.
 */
export const postBroadcastMessage = (messageData, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/messaggi/broadcast/send/',
    {
      method: 'POST',
      body: JSON.stringify(messageData)
    },
    onLogout
  );
};

/**
 * GET /personaggi/api/messaggi/admin/sent/ - Ottiene i messaggi inviati dall'admin.
 */
export const getAdminSentMessages = (onLogout) => {
  return fetchAuthenticated('/personaggi/api/messaggi/admin/sent/', { method: 'GET' }, onLogout);
};

export const saveWebPushSubscription = async (subscription, onLogout) => {
    const token = localStorage.getItem('kor35_token'); // O il nome chiave che usi tu
    
    if (!token) return;

    const response = await fetch('https://www.kor35.it/personaggi/api/webpush/subscribe/', {
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
    `/personaggi/api/personaggio/me/infusioni_acquistabili/?char_id=${characterId}`, 
    { method: 'GET' }
  );
};

/**
 * Acquisisce un'infusione.
 */
export const acquireInfusione = (infusioneId, personaggioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/personaggio/me/acquisisci_infusione/', 
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
    `/personaggi/api/personaggio/me/tessiture_acquistabili/?char_id=${characterId}`, 
    { method: 'GET' }
  );
};

/**
 * Acquisisce una tessitura.
 */
export const acquireTessitura = (tessituraId, personaggioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/personaggio/me/acquisisci_tessitura/', 
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
  return fetchAuthenticated(`/personaggi/api/punteggio/${auraId}/modelli/`, { method: 'GET' });
};

export const selezionaModelloAura = (personaggioId, modelloId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/personaggio/me/seleziona_modello_aura/', 
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
    return await fetchAuthenticated(`/personaggi/api/proposte/?char_id=${charId}`, {
        method: 'GET'
    });
};

export const createProposta = async (data) => {
    return await fetchAuthenticated(`/personaggi/api/proposte/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateProposta = async (id, data) => {
    return await fetchAuthenticated(`/personaggi/api/proposte/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteProposta = async (id) => {
    // Qui fetchAuthenticated potrebbe tornare null (204 No Content), va bene così.
    await fetchAuthenticated(`/personaggi/api/proposte/${id}/`, {
        method: 'DELETE'
    });
    return true;
};

export const sendProposta = async (id) => {
    return await fetchAuthenticated(`/personaggi/api/proposte/${id}/invia_proposta/`, {
        method: 'POST'
    });
};

// --- UTILITIES PUNTEGGI ---

export const getAllPunteggi = async () => {
    // Assicurati che l'URL finisca con /all/ come definito in urls.py
    return await fetchAuthenticated(`/personaggi/api/punteggi/all/`, {
        method: 'GET'
    });
};

export const getMattoniAura = async (auraId) => {
    return await fetchAuthenticated(`/personaggi/api/punteggi/all/`, {
        method: 'GET'
    });
};

